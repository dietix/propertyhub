import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { User, UserRole } from "../types";

interface AuthContextType {
  currentUser: SupabaseUser | null;
  session: Session | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserData(data: Record<string, any>): User {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role as UserRole,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as User;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref para cachear o userId atual e evitar re-fetch desnecessário no TOKEN_REFRESHED
  const currentUserIdRef = useRef<string | null>(null);
  const userDataRef = useRef<User | null>(null);

  async function fetchOrCreateUserData(user: SupabaseUser): Promise<User | null> {
    try {
      // Tenta buscar o usuário existente
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        return mapUserData(data);
      }

      // Se não existe, cria o registro
      if (error?.code === "PGRST116") {
        const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuário";
        
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email!,
            display_name: displayName,
            role: "viewer",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user record:", insertError);
          return null;
        }

        return mapUserData(newUser);
      }

      // AbortError acontece quando há requests concorrentes — não é um erro real
      if (error?.message?.includes("AbortError")) {
        console.debug("fetchOrCreateUserData aborted (concurrent request)");
        return null;
      }

      console.error("Error fetching user data:", error);
      return null;
    } catch (err) {
      // AbortError pode vir como exceção também
      if (err instanceof DOMException && err.name === "AbortError") {
        console.debug("fetchOrCreateUserData aborted (concurrent request)");
        return null;
      }
      console.error("Unexpected error in fetchOrCreateUserData:", err);
      return null;
    }
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
    // O onAuthStateChange vai cuidar de atualizar o estado
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setUserData(null);
    setSession(null);
    setCurrentUser(null);
    currentUserIdRef.current = null;
    userDataRef.current = null;
  }, []);

  function hasPermission(requiredRole: UserRole): boolean {
    if (!userData) return false;

    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      viewer: 1,
    };

    return roleHierarchy[userData.role] >= roleHierarchy[requiredRole];
  }

  useEffect(() => {
    let isMounted = true;

    async function handleSessionChange(nextSession: Session | null) {
      if (!isMounted) return;

      setSession(nextSession);
      setCurrentUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // Se é o mesmo user e já temos userData, não precisa buscar de novo
        // (TOKEN_REFRESHED, VISIBILITY_RESTORE, SIGNED_IN duplicado, etc.)
        const sameUser = currentUserIdRef.current === nextSession.user.id;

        if (sameUser && userDataRef.current) {
          return;
        }

        currentUserIdRef.current = nextSession.user.id;
        const data = await fetchOrCreateUserData(nextSession.user);
        if (isMounted) {
          setUserData(data);
          userDataRef.current = data;
        }
      } else {
        currentUserIdRef.current = null;
        userDataRef.current = null;
        setUserData(null);
      }
    }

    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session).finally(() => {
        if (isMounted) setLoading(false);
      });
    }).catch((error) => {
      console.error("Error getting initial session:", error);
      if (isMounted) setLoading(false);
    });

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

      // Ignora INITIAL_SESSION do onAuthStateChange pois já tratamos via getSession()
      if (event === "INITIAL_SESSION") return;

      await handleSessionChange(session);
    });

    // Quando a aba volta ao foco, tenta recuperar/refrescar a sessão
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      supabase.auth.startAutoRefresh();

      supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
        if (!isMounted) return;

        if (freshSession) {
          // Atualiza session/currentUser no state
          setSession(freshSession);
          setCurrentUser(freshSession.user);

          // Se é um user diferente (ou primeiro load), busca userData
          if (currentUserIdRef.current !== freshSession.user.id) {
            handleSessionChange(freshSession);
          }
        } else if (currentUserIdRef.current) {
          // Tínhamos um user mas agora não tem sessão — sessão expirou
          console.warn("Session expired while tab was inactive");
          setSession(null);
          setCurrentUser(null);
          setUserData(null);
          currentUserIdRef.current = null;
          userDataRef.current = null;
        }
      }).catch((err) => {
        console.error("Error recovering session on visibility change:", err);
      });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const value = {
    currentUser,
    session,
    userData,
    loading,
    login,
    register,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
