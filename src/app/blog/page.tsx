import Image from "next/image"
import Link from "next/link"
import { ArrowLongRightIcon } from "@heroicons/react/24/outline"

// This would eventually come from a CMS or database
const blogPosts = [
  {
    id: 1,
    title: "10 Ways to Save on Prescription Medications",
    excerpt: "Learn the insider tips and tricks to maximize your savings on prescription drugs. From generic alternatives to discount programs, discover how to reduce your medication costs without compromising on quality.",
    image: "/images/blog/10-Ways-to-Save-Blog.jpg",
    category: "Savings Tips",
    readTime: "5 min read",
    date: "March 15, 2024",
  },
  {
    id: 2,
    title: "Understanding Generic vs. Brand Name Drugs",
    excerpt: "What's the real difference between generic and brand name medications? Find out why generics are often the smarter choice and how they can save you money while providing the same benefits.",
    image: "/images/blog/Generic-Brand-Blog.jpg",
    category: "Education",
    readTime: "4 min read",
    date: "March 12, 2024",
  },
  {
    id: 3,
    title: "Your Guide to Medicare Part D Coverage",
    excerpt: "Navigate the complexities of Medicare Part D and make informed decisions about your prescription drug coverage. Learn about enrollment periods, coverage gaps, and how to maximize your benefits.",
    image: "/images/blog/Medicare-D-Blog.jpg",
    category: "Insurance",
    readTime: "6 min read",
    date: "March 10, 2024",
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-4">
            Healthcare Savings Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert advice and tips to help you save money on healthcare and make informed decisions about your medications.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/blog/${post.id}`}>
                <div className="relative h-48">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-dark mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-primary font-semibold hover:text-primary/80 transition-colors">
                    Read More
                    <ArrowLongRightIcon className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-24 bg-[#F8FAFC] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-dark mb-4">
            Stay Updated on Healthcare Savings
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest tips on saving money on prescriptions and healthcare.
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </main>
  )
} 