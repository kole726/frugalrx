'use client'
import { motion } from 'framer-motion'
import { EnvelopeIcon, ShieldCheckIcon, BellIcon, SparklesIcon } from '@heroicons/react/24/outline'

const benefits = [
  {
    icon: SparklesIcon,
    text: 'Exclusive deals and discounts',
  },
  {
    icon: BellIcon,
    text: 'Price drop alerts for your medications',
  },
  {
    icon: ShieldCheckIcon,
    text: 'We never share your information',
  },
]

export default function Newsletter() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter signup
  }

  return (
    <section className="py-24 bg-gradient-to-b from-[#EFFDF6] to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-1/2 h-full bg-light/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-1/2 h-full bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 md:p-12 shadow-xl"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Stay Updated on Prescription Savings
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Join our newsletter and never miss out on new ways to save on your medications
              </p>

              {/* Benefits */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <benefit.icon className="h-6 w-6 text-white/90" />
                    <span className="text-white/90">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Subscribe to Newsletter
                  </button>
                </div>
                <p className="mt-4 text-xs text-center text-gray-500">
                  By subscribing, you agree to our Privacy Policy and Terms of Service
                </p>
              </motion.form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 