'use client'
import { motion, Variants } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLongRightIcon } from '@heroicons/react/24/outline'

const blogPosts = [
  {
    id: 1,
    title: '10 Ways to Save on Prescription Medications',
    excerpt: 'Learn the insider tips and tricks to maximize your savings on prescription drugs...',
    image: '/images/blog/Ways-to-Save-Blog.jpg',
    category: 'Savings Tips',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Understanding Generic vs. Brand Name Drugs',
    excerpt: "What's the real difference between generic and brand name medications? Find out...",
    image: '/images/blog/Generic-Brand-Blog.jpg',
    category: 'Education',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'Your Guide to Medicare Part D Coverage',
    excerpt: 'Navigate the complexities of Medicare Part D and make informed decisions about...',
    image: '/images/blog/Medicare-D-Blog.jpg',
    category: 'Insurance',
    readTime: '6 min read',
  },
]

export default function BlogPreview() {
  const fadeIn: Variants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const staggerChildren: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-[#E1F4EA] to-white">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            Healthcare Savings Blog
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert advice and tips to help you save money on healthcare
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
                  <div className="text-sm text-gray-500 mb-2">{post.readTime}</div>
                  <h3 className="text-xl font-bold text-dark mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center text-primary font-semibold hover:text-primary/80 transition-colors">
                    Read More
                    <ArrowLongRightIcon className="w-5 h-5 ml-2" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/blog"
            className="inline-flex items-center text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            View All Articles
            <ArrowLongRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
} 