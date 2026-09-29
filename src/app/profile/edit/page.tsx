"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Globe,
  Loader2,
  MapPin,
  Save,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils/errorHandler";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || profile.name || "");
        setBio(profile.bio || "");
        setLocation(profile.location || "");
        setWebsite(profile.website || "");
        setTwitter(profile.twitter || "");
        setAvatarUrl(profile.avatar_url || "");
        setCoverUrl(profile.cover_url || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: "avatars" | "event-covers",
    setter: (url: string) => void,
    setUploading: (state: boolean) => void
  ) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0 || !userId) return;

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setter(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err, "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);

    const updates = {
      id: userId,
      full_name: fullName,
      bio,
      location,
      website,
      twitter,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    setSaving(false);

    if (error) {
      toast.error(error, "Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
      router.push("/profile");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-16">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* COVER & AVATAR EDIT */}
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="relative h-40 bg-neutral-100 sm:h-52">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-violet-100 via-violet-50 to-white" />
              )}
              <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/80">
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                Change Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "event-covers", setCoverUrl, setUploadingCover)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative px-6 pb-6">
              <div className="relative -mt-12 inline-block">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-2xl border-4 border-white bg-neutral-100 object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-2xl font-bold text-violet-700 shadow-md">
                    <User className="h-8 w-8 text-violet-600" />
                  </div>
                )}
                <label className="absolute bottom-1 right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow transition hover:bg-violet-700">
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "avatars", setAvatarUrl, setUploadingAvatar)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-neutral-900">Personal Details</h2>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell attendees and creators about yourself..."
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Location</label>
                <div className="relative mt-1.5">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lagos, Nigeria"
                    className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Website</label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}