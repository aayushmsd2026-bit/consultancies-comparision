import { getTranslations } from "next-intl/server";
import { ReviewQueue } from "@/components/admin/review-queue";
import { Link } from "@/i18n/navigation";
import { getQueue, getQueueCounts, QUEUE_STATUSES, type QueueStatus } from "@/lib/admin/data";
import { cn } from "@/lib/cn";
import { isAdminSession } from "@/lib/admin/auth";

/** The review queue: pending reviews, newest first. Tabs show the other statuses. */
export default async function AdminQueuePage({ searchParams }: PageProps<"/[locale]/admin">) {
  // The layout shows the sign-in form to everyone else. Nothing is loaded for them.
  if (!(await isAdminSession())) return null;
  const params = await searchParams;
  const requested = Array.isArray(params.status) ? params.status[0] : params.status;
  const status: QueueStatus = (QUEUE_STATUSES as readonly string[]).includes(requested ?? "")
    ? (requested as QueueStatus)
    : "pending";

  const t = await getTranslations({ locale: "en", namespace: "admin.queue" });
  const [reviews, counts] = await Promise.all([getQueue(status), getQueueCounts()]);
  const dates = Object.fromEntries(
    reviews.map((review) => [
      review.id,
      new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" }).format(
        new Date(review.createdAt),
      ),
    ]),
  );

  return (
    <>
      <h1 className="font-sans text-heading font-semibold">{t("title")}</h1>
      <ul className="my-3 flex flex-wrap gap-2">
        {QUEUE_STATUSES.map((value) => (
          <li key={value}>
            <Link
              href={value === "pending" ? "/admin" : `/admin?status=${value}`}
              aria-current={value === status ? "page" : undefined}
              className={cn(
                "tabular inline-flex min-h-9 items-center rounded-[0.5rem] border px-3 font-semibold",
                value === status ? "border-ink bg-ink text-paper" : "border-line-strong hover:bg-paper-sunk",
              )}
            >
              {t(value)} ({counts[value]})
            </Link>
          </li>
        ))}
      </ul>
      <ReviewQueue reviews={reviews} dates={dates} />
    </>
  );
}
