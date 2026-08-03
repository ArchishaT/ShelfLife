import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Medicine = Tables<"medicines">;
export type FamilyMember = Tables<"family_members">;
export type Profile = Tables<"profiles">;
export type MedicineInput = Omit<TablesInsert<"medicines">, "user_id">;

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useMedicines() {
  return useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useMedicine(id: string) {
  return useQuery({
    queryKey: ["medicines", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useFamilyMembers() {
  return useQuery({
    queryKey: ["family_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Keeps the medicine list in sync across devices. */
export function useMedicinesRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("medicines-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "medicines" }, () => {
        qc.invalidateQueries({ queryKey: ["medicines"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useSaveMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: MedicineInput }) => {
      const uid = await currentUserId();
      if (id) {
        const { data, error } = await supabase
          .from("medicines")
          .update(values)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("medicines")
        .insert({ ...values, user_id: uid })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useDeleteMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useRestoreMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Medicine) => {
      const { error } = await supabase.from("medicines").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useSaveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { id?: string; name: string; relation: string; color: string }) => {
      const uid = await currentUserId();
      if (values.id) {
        const { error } = await supabase
          .from("family_members")
          .update({ name: values.name, relation: values.relation, color: values.color })
          .eq("id", values.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("family_members").insert({
        user_id: uid,
        name: values.name,
        relation: values.relation,
        color: values.color,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family_members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family_members"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export async function uploadMedicinePhoto(file: File) {
  const uid = await currentUserId();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("medicine-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function useSignedPhoto(path?: string | null) {
  return useQuery({
    queryKey: ["photo", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("medicine-photos")
        .createSignedUrl(path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
