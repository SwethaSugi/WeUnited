"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Chapter, Profile } from "@/lib/types";
import { useUser } from "./useUser";

interface UseChapterReturn {
  chapter: Chapter | null;
  members: Profile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChapter(): UseChapterReturn {
  const { profile } = useUser();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchChapter = useCallback(async () => {
    if (!profile?.chapter_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch chapter details
    const { data: chapterData, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", profile.chapter_id)
      .single();

    if (chapterError) {
      setError(chapterError.message);
      setLoading(false);
      return;
    }

    setChapter(chapterData);

    // Fetch chapter members
    const { data: membersData, error: membersError } = await supabase
      .from("profiles")
      .select("*")
      .eq("chapter_id", profile.chapter_id)
      .eq("is_active", true)
      .order("full_name");

    if (membersError) {
      setError(membersError.message);
    } else {
      setMembers(membersData ?? []);
    }

    setLoading(false);
  }, [profile?.chapter_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  return { chapter, members, loading, error, refetch: fetchChapter };
}
