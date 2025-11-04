import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold mb-6 tracking-tight">
          DoubleVision
        </h1>

        <p className="text-xl text-text-secondary mb-8">
          A daily photography feedback game
        </p>

        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <ol className="text-left space-y-3 text-text-secondary">
            <li className="flex items-start">
              <span className="text-present font-bold mr-3">1.</span>
              <span>Upload one photo from your photography session each day</span>
            </li>
            <li className="flex items-start">
              <span className="text-present font-bold mr-3">2.</span>
              <span>Review 5 random photos with honest, thoughtful feedback</span>
            </li>
            <li className="flex items-start">
              <span className="text-present font-bold mr-3">3.</span>
              <span>After completing 5 reviews, unlock feedback on your photo</span>
            </li>
            <li className="flex items-start">
              <span className="text-present font-bold mr-3">4.</span>
              <span>Build your ELO rating by leaving quality reviews</span>
            </li>
          </ol>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/login" className="btn-primary">
            Get Started
          </Link>
          <Link href="/about" className="btn-secondary">
            Learn More
          </Link>
        </div>

        <p className="mt-8 text-sm text-text-secondary">
          Inspired by Wordle • Built for photographers
        </p>
      </div>
    </div>
  );
}
