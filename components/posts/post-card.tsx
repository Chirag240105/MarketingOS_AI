"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { BadgeDollarSign, Edit3, ImageIcon, Loader2, Rocket, Save, X } from "lucide-react";
import { generateAdPreviewImage, launchAdFromPost } from "@/app/actions/launch-ad-action";
import { updateGeneratedPost } from "@/actions/post";
import { ApprovalActions } from "@/components/posts/approval-actions";
import { PlatformPreview } from "@/components/posts/platform-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

type EditablePost = {
  id: string;
  platform: string;
  title?: string | null;
  body: string;
  caption?: string | null;
  hashtags: string[];
  mentions?: string[];
  callToAction?: string | null;
  status: string;
  mediaUrls: string[];
  adId?: string | null;
  adStatus?: string | null;
  campaign?: {
    name: string;
    workspace?: {
      brandProfile?: {
        website?: string | null;
      } | null;
    } | null;
  } | null;
};

const imageMeta: Record<string, { label: string; dimensions: string }> = {
  INSTAGRAM: { label: "Instagram Poster", dimensions: "1080x1350" },
  FACEBOOK: { label: "Facebook Banner", dimensions: "1200x628" },
  LINKEDIN: { label: "LinkedIn Banner", dimensions: "1200x628" },
  X: { label: "X Square", dimensions: "1080x1080" },
  TIKTOK: { label: "TikTok Thumbnail", dimensions: "1080x1920" },
};

export function PostCard({ post, canApprove = true }: { post: EditablePost; canApprove?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [adPending, startAdTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(post.mediaUrls[0] || "");
  const [adId, setAdId] = useState(post.adId || "");
  const [adForm, setAdForm] = useState({
    linkUrl: post.campaign?.workspace?.brandProfile?.website || "",
    adMessage: post.caption || post.body,
    dailyBudgetDollars: 1,
    campaignName: post.campaign?.name || post.title || "MarketingOS AI Campaign",
  });
  const [values, setValues] = useState({
    title: post.title || "",
    body: post.body,
    caption: post.caption || "",
    callToAction: post.callToAction || "",
    hashtags: post.hashtags.join(", "),
  });

  function saveDraft() {
    setError(null);
    startTransition(async () => {
      try {
        await updateGeneratedPost({
          postId: post.id,
          title: values.title || null,
          body: values.body,
          caption: values.caption || null,
          callToAction: values.callToAction || null,
          hashtags: values.hashtags.split(",").map((tag) => tag.trim()).filter(Boolean),
          mentions: post.mentions || [],
        });
        setEditing(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save draft.");
      }
    });
  }

  function generatePreview() {
    setError(null);
    startAdTransition(async () => {
      try {
        const result = await notify.promise(generateAdPreviewImage(post.id), {
          loading: "Generating ad image...",
          success: "Image ready",
          error: "Image generation failed — try again or check your HF_TOKEN",
        });
        setPreviewUrl(result.imageUrl);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Image generation failed — try again or check your HF_TOKEN";
        setError(message);
      }
    });
  }

  function launchAd() {
    setError(null);
    startAdTransition(async () => {
      const result = await notify.promise(launchAdFromPost({
        postId: post.id,
        linkUrl: adForm.linkUrl,
        adMessage: adForm.adMessage,
        dailyBudgetDollars: adForm.dailyBudgetDollars,
        campaignName: adForm.campaignName,
      }), {
        loading: "Launching ad...",
        success: "Ad launched — review it in Meta Ads Manager",
        error: "Ad launch failed — verify your Meta Ad Account ID and token permissions",
      });
      if (result.success) {
        setAdId(result.adId || "");
        setModalOpen(false);
      } else {
        const message = result.error || "Could not launch ad.";
        setError(message);
      }
    });
  }

  function publishAd() {
    setError(null);
    startAdTransition(async () => {
      const result = await notify.promise(launchAdFromPost(post.id), {
        loading: "Publishing ad...",
        success: "Ad published as paused in Meta Ads Manager",
        error: "Ad publish failed",
      });
      if (result.success) {
        setAdId(result.adId || "");
      } else {
        setError(result.error || "Could not publish ad.");
      }
    });
  }

  const meta = imageMeta[post.platform] || { label: "Square Creative", dimensions: "1080x1080" };
  const canLaunchAd = post.status === "APPROVED" && previewUrl;

  return (
    <Card className="overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={post.status === "APPROVED" ? "emerald" : post.status === "REJECTED" ? "rose" : "amber"}>{post.status.replaceAll("_", " ")}</Badge>
          {adId ? <Badge tone="indigo">Ad ID: {adId}</Badge> : post.adStatus ? <Badge tone="slate">{post.adStatus}</Badge> : null}
        </div>
        <span className="text-xs text-slate-500">AI text draft</span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <label className="text-xs text-slate-400">Headline<Input className="mt-1" value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} /></label>
          <label className="text-xs text-slate-400">Primary text<textarea className="mt-1 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none focus:border-indigo-400" value={values.body} onChange={(event) => setValues((current) => ({ ...current, body: event.target.value }))} /></label>
          <label className="text-xs text-slate-400">Caption<textarea className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none focus:border-indigo-400" value={values.caption} onChange={(event) => setValues((current) => ({ ...current, caption: event.target.value }))} /></label>
          <label className="text-xs text-slate-400">CTA<Input className="mt-1" value={values.callToAction} onChange={(event) => setValues((current) => ({ ...current, callToAction: event.target.value }))} /></label>
          <label className="text-xs text-slate-400">Hashtags<Input className="mt-1" value={values.hashtags} onChange={(event) => setValues((current) => ({ ...current, hashtags: event.target.value }))} /></label>
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={pending}>Cancel</Button><Button size="sm" onClick={saveDraft} disabled={pending || !values.body.trim()}><Save className="size-3.5" />{pending ? "Saving..." : "Save draft"}</Button></div>
        </div>
      ) : (
        <>
          <PlatformPreview platform={post.platform} title={post.title} body={post.body} caption={post.caption} hashtags={post.hashtags} cta={post.callToAction} />
          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
              <Image src={previewUrl} alt={`${meta.label} ad preview`} width={1080} height={1350} unoptimized className="aspect-[4/5] w-full object-cover" />
              <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-400">
                <span>{meta.label}</span>
                <span>{meta.dimensions}</span>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Edit3 className="size-3.5" />Edit</Button>
            {canApprove && (post.status === "PENDING_APPROVAL" || post.status === "EDITING" || post.status === "GENERATED") ? <ApprovalActions postId={post.id} /> : null}
            {post.status === "APPROVED" ? (
              <>
                <Button size="sm" variant="secondary" onClick={generatePreview} disabled={adPending}>
                  {adPending ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                  Generate Ad Image
                </Button>
                {canLaunchAd ? (
                  <>
                    <Button size="sm" onClick={publishAd} disabled={adPending}>
                      {adPending ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                      Publish
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)} disabled={adPending}>
                      <BadgeDollarSign className="size-3.5" />
                      Edit details before publishing
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
          {post.status === "APPROVED" ? <p className="mt-3 text-xs leading-5 text-slate-500">Ads launch in PAUSED state. Activate them in Meta Ads Manager after review.</p> : null}
          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        </>
      )}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-white">Launch Instagram ad</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Creates a paused campaign, ad set, creative, and ad in Meta Ads Manager.</p>
              </div>
              <button className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" type="button" onClick={() => setModalOpen(false)} aria-label="Close ad launch modal">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <label className="text-xs text-slate-400">Destination URL - where people land when they tap your ad (e.g. your product page, store, or website).<Input className="mt-1" value={adForm.linkUrl} onChange={(event) => setAdForm((current) => ({ ...current, linkUrl: event.target.value }))} placeholder="https://example.com/offer" /></label>
              <p className="-mt-2 text-xs leading-5 text-slate-500">Use the page where visitors can learn more, buy, book, or claim the offer.</p>
              <label className="text-xs text-slate-400">Ad Message<textarea className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none focus:border-indigo-400" value={adForm.adMessage} onChange={(event) => setAdForm((current) => ({ ...current, adMessage: event.target.value }))} /></label>
              <label className="text-xs text-slate-400">Daily Budget ($)<Input className="mt-1" min={1} type="number" value={adForm.dailyBudgetDollars} onChange={(event) => setAdForm((current) => ({ ...current, dailyBudgetDollars: Number(event.target.value) }))} /></label>
              <label className="text-xs text-slate-400">Campaign Name<Input className="mt-1" value={adForm.campaignName} onChange={(event) => setAdForm((current) => ({ ...current, campaignName: event.target.value }))} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={adPending}>Cancel</Button>
              <Button onClick={launchAd} disabled={adPending || !adForm.linkUrl || !adForm.adMessage || !adForm.campaignName || adForm.dailyBudgetDollars < 1}>
                {adPending ? <Loader2 className="size-4 animate-spin" /> : <BadgeDollarSign className="size-4" />}
                Launch Paused Ad
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
