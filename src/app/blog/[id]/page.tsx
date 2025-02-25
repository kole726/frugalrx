import Image from "next/image"
import Link from "next/link"
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline"
import ShareButtons from "@/components/blog/ShareButtons"

// This would eventually come from a CMS or database
const blogPosts = [
  {
    id: 1,
    title: "10 Ways to Save on Prescription Medications",
    content: `
      <p>Prescription medication costs can be a significant burden on your budget. Here are ten effective ways to save money on your prescriptions without compromising on quality:</p>

      <h2>1. Use Generic Medications</h2>
      <p>Generic medications contain the same active ingredients as brand-name drugs but often cost significantly less. Ask your doctor if a generic version is available for your prescription.</p>

      <h2>2. Compare Pharmacy Prices</h2>
      <p>Medication prices can vary significantly between pharmacies. Use FrugalRx to compare prices at different pharmacies in your area.</p>

      <h2>3. Use Prescription Discount Cards</h2>
      <p>Prescription discount cards like FrugalRx can help you save up to 80% on your medications, even if you have insurance.</p>

      <h2>4. Ask About Patient Assistance Programs</h2>
      <p>Many pharmaceutical companies offer programs to help patients afford their medications. Check if you qualify for these programs.</p>

      <h2>5. Consider 90-Day Supplies</h2>
      <p>Buying a 90-day supply instead of a 30-day supply can often result in significant savings per dose.</p>
    `,
    image: "/images/blog/10-Ways-to-Save-Blog.jpg",
    category: "Savings Tips",
    readTime: "5 min read",
    date: "March 15, 2024",
    author: {
      name: "Dr. Sarah Johnson",
      role: "Healthcare Savings Expert",
      image: "/images/authors/sarah.jpg"
    }
  },
  {
    id: 2,
    title: "Understanding Generic vs. Brand Name Drugs",
    content: `
      <p>When it comes to prescription medications, one of the most common questions is about the difference between generic and brand-name drugs. Let's break down what you need to know:</p>

      <h2>What Are Generic Drugs?</h2>
      <p>Generic drugs are copies of brand-name drugs that have exactly the same dosage, intended use, effects, side effects, route of administration, risks, safety, and strength as the original drug.</p>

      <h2>FDA Requirements for Generic Drugs</h2>
      <p>The FDA requires generic drugs to be as safe and effective as their brand-name counterparts. Generic drugs must:</p>
      <ul>
        <li>Contain the same active ingredients as the brand-name drug</li>
        <li>Be identical in strength, dosage form, and route of administration</li>
        <li>Meet the same batch requirements for identity, strength, purity, and quality</li>
        <li>Be manufactured under the same strict standards as brand-name drugs</li>
      </ul>

      <h2>Cost Differences</h2>
      <p>Generic drugs typically cost 80-85% less than their brand-name counterparts. This significant price difference exists because generic manufacturers don't have the same development costs as brand-name manufacturers.</p>

      <h2>Why Choose Generic Drugs?</h2>
      <p>Choosing generic drugs can lead to substantial savings without compromising on quality or effectiveness. With FrugalRx, you can save even more on both generic and brand-name medications.</p>
    `,
    image: "/images/blog/Generic-Brand-Blog.jpg",
    category: "Education",
    readTime: "4 min read",
    date: "March 12, 2024",
    author: {
      name: "Dr. Michael Chen",
      role: "Clinical Pharmacist",
      image: "/images/authors/michael.jpg"
    }
  },
  {
    id: 3,
    title: "Your Guide to Medicare Part D Coverage",
    content: `
      <p>Medicare Part D prescription drug coverage can be complex to understand. This comprehensive guide will help you navigate your options and make informed decisions about your coverage.</p>

      <h2>What is Medicare Part D?</h2>
      <p>Medicare Part D is the federal government's prescription drug program that provides coverage for prescription medications. It's available to everyone with Medicare, and enrollment is voluntary.</p>

      <h2>Key Features of Part D Coverage</h2>
      <ul>
        <li>Monthly premium payments</li>
        <li>Annual deductible</li>
        <li>Copayments or coinsurance for covered drugs</li>
        <li>Coverage gap ("donut hole")</li>
        <li>Catastrophic coverage</li>
      </ul>

      <h2>Understanding the Coverage Gap</h2>
      <p>The coverage gap, or "donut hole," begins after you and your plan spend a certain amount on covered drugs. During this period, you'll pay more for your medications until you reach catastrophic coverage.</p>

      <h2>Using FrugalRx with Medicare</h2>
      <p>Even if you have Medicare Part D, FrugalRx can sometimes offer lower prices than your insurance copays. It's worth comparing prices to ensure you're getting the best deal on your prescriptions.</p>

      <h2>Tips for Managing Drug Costs</h2>
      <p>Consider these strategies to help manage your prescription drug costs:</p>
      <ul>
        <li>Compare Part D plans annually during open enrollment</li>
        <li>Ask about generic alternatives</li>
        <li>Use FrugalRx to compare prices</li>
        <li>Consider mail-order pharmacy options</li>
      </ul>
    `,
    image: "/images/blog/Medicare-D-Blog.jpg",
    category: "Insurance",
    readTime: "6 min read",
    date: "March 10, 2024",
    author: {
      name: "Emily Rodriguez",
      role: "Insurance Specialist",
      image: "/images/authors/emily.jpg"
    }
  }
]

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find(post => post.id === parseInt(params.id))

  if (!post) {
    return <div>Post not found</div>
  }

  // Get the current URL (this will run on the client)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <main className="min-h-screen bg-white py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/blog"
          className="inline-flex items-center text-primary hover:text-primary/80 font-semibold mb-8"
        >
          <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <article>
          <div className="mb-8">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-dark">{post.author.name}</div>
                <div className="text-sm text-gray-500">{post.author.role}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <div>{post.date}</div>
              <div>{post.readTime}</div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-[2/1] mb-12 rounded-2xl overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Share and Subscribe Section */}
        <div className="mt-16 border-t pt-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-dark mb-4">Share this article</h3>
              <ShareButtons 
                url={url}
                title={post.title}
                description={post.excerpt || post.title}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark mb-4">Subscribe to our newsletter</h3>
              <form className="flex gap-4">
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
        </div>
      </div>
    </main>
  )
} 