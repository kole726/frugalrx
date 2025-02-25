'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { StarIcon } from '@heroicons/react/24/solid'

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    location: "Dallas, TX",
    image: '/images/testimonials/sarah.jpg',
    text: "I saved over $200 on my monthly prescription costs using FrugalRx. The card was so easy to use at my local pharmacy!",
    rating: 5,
    medication: "Diabetes Medication",
    savings: "$200/month",
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'San Francisco, CA',
    image: '/images/testimonials/michael.jpg',
    text: 'As someone without insurance, FrugalRx has been a lifesaver. I can now afford my blood pressure medication without breaking the bank.',
    rating: 5,
    medication: 'Blood Pressure Medication',
    savings: '$85/month',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    location: 'Miami, FL',
    image: '/images/testimonials/emily.jpg',
    text: 'The savings are incredible! I compared prices at different pharmacies and found the best deal. Thank you FrugalRx!',
    rating: 5,
    medication: 'Anxiety Medication',
    savings: '$150/month',
  },
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
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 relative"
            >
              {/* Quote mark decoration */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xl font-serif">
                "
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="text-gray-600 mb-6">{testimonial.text}</p>

              {/* User info */}
              <div className="flex items-center">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-dark">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>

              {/* Savings info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Medication: </span>
                    <span className="text-dark">{testimonial.medication}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Savings: </span>
                    <span className="text-primary font-semibold">{testimonial.savings}</span>
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