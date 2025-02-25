"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { StarIcon } from "@heroicons/react/24/solid"

const testimonials = [
  {
    content: "I saved over 75% on my prescription using FrugalRx. The digital card was so easy to use at my local pharmacy.",
    author: {
      name: "Sarah Johnson",
      role: "Customer",
      image: "/images/testimonials/Sarah-Johnson.jpg"
    }
  },
  {
    content: "As a pharmacist, I recommend FrugalRx to patients who are struggling with medication costs. It's a reliable way to save.",
    author: {
      name: "Michael Chen",
      role: "Pharmacist",
      image: "/images/testimonials/Michael-Chen.jpg"
    }
  },
  {
    content: "FrugalRx helped me find the best price for my medications. I'm saving hundreds of dollars every month.",
    author: {
      name: "Ronald Brown",
      role: "Customer",
      image: "/images/testimonials/Ronald-Brown.jpg"
    }
  }
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
            Real Savings from Real People
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how FrugalRx has helped thousands save on their prescriptions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 relative"
            >
              {/* Quote mark decoration */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary text-xl font-serif">"</span>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 italic">
                  {testimonial.content}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.author.image}
                    alt={testimonial.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-dark">
                    {testimonial.author.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.author.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 pt-16 border-t border-gray-100"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100k+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$50M+</div>
              <div className="text-gray-600">Customer Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-600">Would Recommend</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 