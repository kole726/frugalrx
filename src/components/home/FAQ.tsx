'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    id: 1,
    question: "How does FrugalRx work?",
    answer: "FrugalRx provides free prescription discount cards that can be used at over 59,000 pharmacies nationwide. Simply show your card to the pharmacist when filling your prescription to receive instant savings of up to 80%.",
  },
  {
    id: 2,
    question: "Is FrugalRx really free to use?",
    answer: "Yes! FrugalRx is completely free to use. There are no fees, no registration required, and no obligations. We make our money through small transaction fees paid by the pharmacies, not from our users.",
  },
  {
    id: 3,
    question: 'Can I use FrugalRx with my insurance?',
    answer: 'While you cannot combine FrugalRx with insurance, you can use whichever provides the better price. Many times, our prices are lower than insurance copays, especially for generic medications.',
  },
  {
    id: 4,
    question: 'Which pharmacies accept FrugalRx?',
    answer: 'FrugalRx is accepted at most major pharmacy chains including CVS, Walgreens, Walmart, Rite Aid, and thousands of independent pharmacies. Use our pharmacy locator to find participating locations near you.',
  },
  {
    id: 5,
    question: 'How much can I save with FrugalRx?',
    answer: 'Savings vary by medication and pharmacy but typically range from 40-80% off retail prices. Some customers save hundreds of dollars per month on their prescriptions.',
  },
]

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null)

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
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about saving money on prescriptions
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-4"
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-lg font-semibold text-dark text-left">
                  {faq.question}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openId === faq.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white px-6 pb-6 rounded-b-xl shadow-md">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-xl text-gray-600 mb-6">
            Still have questions? We're here to help!
          </p>
          <button className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  )
} 