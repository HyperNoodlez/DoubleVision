import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserPhotosWithPagination } from "@/lib/db/photos";
import { StarRating } from "@/components/RatingDistribution";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const userId = session.user.id;
  const currentPage = parseInt(params.page || "1", 10);

  // Fetch photos with pagination
  const { photos, total, page, totalPages } = await getUserPhotosWithPagination(
    userId,
    currentPage,
    12
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Photo Archive</h1>
              <p className="text-text-secondary">
                {total} {total === 1 ? "photo" : "photos"} uploaded
              </p>
            </div>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div key={photo._id} className="card">
                  <Link
                    href={`/feedback?photoId=${photo._id}`}
                    className="block relative aspect-square mb-4"
                  >
                    <Image
                      src={photo.imageUrl}
                      alt="Photo"
                      fill
                      className="object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
                    />
                  </Link>

                  <div className="space-y-2">
                    {/* Upload Date */}
                    <div className="text-sm text-text-secondary">
                      {new Date(photo.uploadDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>

                    {/* Rating */}
                    {photo.averageScore !== undefined && (
                      <div className="flex items-center justify-between">
                        <StarRating rating={photo.averageScore} size="sm" />
                        <div className="text-2xl font-bold text-present">
                          {photo.averageScore.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {/* Review Count */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        {photo.reviewsReceived}{" "}
                        {photo.reviewsReceived === 1 ? "review" : "reviews"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          photo.status === "reviewed"
                            ? "bg-correct/20 text-correct"
                            : photo.status === "pending"
                            ? "bg-present/20 text-present"
                            : "bg-surface text-text-secondary"
                        }`}
                      >
                        {photo.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/archive?page=${page - 1}`}
                    className={`btn-secondary ${
                      page === 1 ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    ← Previous
                  </Link>

                  <div className="text-sm text-text-secondary">
                    Page {page} of {totalPages}
                  </div>

                  <Link
                    href={`/archive?page=${page + 1}`}
                    className={`btn-secondary ${
                      page === totalPages ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    Next →
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-bold mb-2">No Photos Yet</h3>
            <p className="text-text-secondary mb-6">
              Start uploading photos to build your archive
            </p>
            <Link href="/dashboard" className="btn-primary inline-block">
              Upload Your First Photo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
