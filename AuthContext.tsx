'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getDemoProfile, saveDemoProfile } from '@/lib/supabaseClient';
import { UserProfile, Quest, InventoryItem } from '@/lib/rpgTypes';
import {
  fetchUserProfile,
  updateUserProfile as dbUpdateProfile,
  fetchUserQuests,
  fetchUserInventory,
} from '@/lib/rpgDatabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  quests: Quest[];
  inventory: InventoryItem[];
  isLoading: boolean;
  isVerified: boolean;
  isDemoUser: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, metadata?: { username?: string; avatar?: string; pet_type?: string }) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  loginAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshQuests: () => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Email is considered verified if email_confirmed_at is present, or if it's a demo guest session
  const isVerified = Boolean(
    isDemoUser || 
    (user && (user.email_confirmed_at || user.confirmed_at || user.app_metadata?.provider === 'google'))
  );

  // Load all user RPG data in parallel with strict RLS isolation
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [profRes, questsRes, invRes] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserQuests(userId),
        fetchUserInventory(userId),
      ]);

      if (profRes.profile) {
        setProfile(profRes.profile);
      }
      setQuests(questsRes.quests || []);
      setInventory(invRes.items || []);
    } catch (err) {
      console.error('[AuthContext] Error loading user data:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { profile: p } = await fetchUserProfile(user.id);
      if (p) setProfile(p);
    } else if (isDemoUser) {
      setProfile(getDemoProfile());
    }
  }, [user, isDemoUser]);

  const refreshQuests = useCallback(async () => {
    if (user) {
      const { quests: q } = await fetchUserQuests(user.id);
      setQuests(q);
    } else if (isDemoUser) {
      const { quests: q } = await fetchUserQuests('demo-user-123');
      setQuests(q);
    }
  }, [user, isDemoUser]);

  const refreshInventory = useCallback(async () => {
    if (user) {
      const { items: i } = await fetchUserInventory(user.id);
      setInventory(i);
    } else if (isDemoUser) {
      const { items: i } = await fetchUserInventory('demo-user-123');
      setInventory(i);
    }
  }, [user, isDemoUser]);

  useEffect(() => {
    // 1. Check if user is in demo guest mode
    if (typeof window !== 'undefined') {
      const demoActive = localStorage.getItem('rekindle_demo_active');
      if (demoActive === 'true' && !isSupabaseConfigured) {
        setIsDemoUser(true);
        setProfile(getDemoProfile());
        fetchUserQuests('demo-user-123').then(({ quests: q }) => setQuests(q));
        fetchUserInventory('demo-user-123').then(({ items: i }) => setInventory(i));
        setIsLoading(false);
        return;
      }
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 2. Fetch initial session from Supabase
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        loadUserData(currentSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 3. Listen to Auth State Changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await loadUserData(newSession.user.id);
        } else if (!isDemoUser) {
          // Strict cleanup on sign out
          setProfile(null);
          setQuests([]);
          setInventory([]);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Auth Operations
  const signUp = async (
    email: string,
    password: string,
    metadata?: { username?: string; avatar?: string; pet_type?: string }
  ) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata || {
          username: email.split('@')[0],
          avatar: 'female_traveler',
          pet_type: 'fuzzy_cat',
        },
      },
    });

    if (data.user && !error) {
      setUser(data.user);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session && !error) {
      setSession(data.session);
      setUser(data.user);
      setIsDemoUser(false);
      await loadUserData(data.user.id);
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/cottage` : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rekindle_demo_active');
      }
    } else if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    // Complete memory & state cleanup (strict data isolation between users)
    setUser(null);
    setSession(null);
    setProfile(null);
    setQuests([]);
    setInventory([]);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env.local') };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  };

  const loginAsGuest = () => {
    setIsDemoUser(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rekindle_demo_active', 'true');
    }
    const demo = getDemoProfile();
    setProfile(demo);
    fetchUserQuests('demo-user-123').then(({ quests: q }) => setQuests(q));
    fetchUserInventory('demo-user-123').then(({ items: i }) => setInventory(i));
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };

    if (isDemoUser || !user || !isSupabaseConfigured) {
      setProfile(newProfile);
      saveDemoProfile(newProfile);
      return;
    }

    const { error } = await dbUpdateProfile(user.id, updates);
    if (error) {
      console.error('[AuthContext] Supabase profile update failed:', error.message);
      return;
    }

    // Update the in-memory view only after Supabase accepted the write.
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        quests,
        inventory,
        isLoading,
        isVerified,
        isDemoUser,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
        loginAsGuest,
        updateProfile,
        refreshProfile,
        refreshQuests,
        refreshInventory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
