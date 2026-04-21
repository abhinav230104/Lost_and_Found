"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import { ApiError, apiPost, apiUploadImage } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ItemType = "lost" | "found";

type CreateItemResponse = {
  message: string;
  item: { id: string };
};

function normalizeItemType(value: string | null): ItemType {
  return value === "found" ? "found" : "lost";
}

export default function NewItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = useMemo(() => normalizeItemType(searchParams.get("type")), [searchParams]);

  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !location.trim() || !date) {
      toast.error("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (file) {
        const uploaded = await apiUploadImage(file);
        imageUrl = uploaded.url;
      }

      await apiPost<CreateItemResponse>("/api/items", {
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        date,
        imageUrl,
      });

      toast.success("Item posted successfully.");
      router.push("/my-items");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to post item.");
      } else {
        toast.error("Failed to post item.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">Post Item</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a lost or found listing so others can help reconnect it.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/my-items">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
          <CardDescription>Fields marked required are needed to publish your listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitItem} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-type">Listing type</Label>
                <select
                  id="item-type"
                  className="select"
                  value={type}
                  onChange={(e) => setType(normalizeItemType(e.target.value))}
                  disabled={submitting}
                >
                  <option value="lost">Lost item</option>
                  <option value="found">Found item</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-date">Date</Label>
                <Input
                  id="item-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                placeholder="Black backpack near library"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-location">Location</Label>
              <Input
                id="item-location"
                placeholder="Main library, 2nd floor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                maxLength={120}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Include identifying details, color, brand, and anything useful for verification."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                maxLength={1500}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">Image (optional)</Label>
              <div className="rounded-lg border border-dashed border-border p-4">
                <label htmlFor="item-image" className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <UploadCloud className="h-4 w-4" />
                  {file ? file.name : "Choose JPEG, PNG, or WebP (max 5MB)"}
                </label>
                <input
                  id="item-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={submitting}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Item"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
