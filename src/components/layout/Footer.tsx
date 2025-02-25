import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Social */}
          <div className="col-span-1">
            <Image
              src="/images/Frugal-Rx-Logo-800w.png"
              alt="FrugalRx Logo"
              width={160}
              height={48}
              className="h-12 w-auto brightness-0 invert"
            />
            <div className="mt-4 space-x-4">
              {/* Add social media icons/links here */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="hover:text-light transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/find-rx-savings" className="hover:text-light transition-colors">
                  Find Rx Savings
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-light transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="hover:text-light transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/affiliate-program" className="hover:text-light transition-colors">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-light transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <form className="mt-4">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-l-full text-dark"
                />
                <button
                  type="submit"
                  className="bg-accent px-6 py-2 rounded-r-full hover:bg-accent/90 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} FrugalRx. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 