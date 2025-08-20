'use client'

import type { FooterWidget as FooterWidgetType } from '@/types/shopifyWidgets'

interface FooterWidgetProps {
  widget: FooterWidgetType
}

export default function FooterWidget({ widget }: FooterWidgetProps) {
  const { config } = widget

  return (
    <footer 
      className="w-full pt-12 pb-6"
      style={{ 
        backgroundColor: config.backgroundColor || '#1F2937',
        color: config.textColor || '#ffffff'
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div>
            <div className="text-2xl font-bold mb-4" style={{ color: config.textColor || '#ffffff' }}>
              Your Store
            </div>
            <p className="text-sm opacity-75 mb-4">
              Building amazing shopping experiences for our customers worldwide.
            </p>
            
            {/* Social Media */}
            {config.socialMedia && config.socialMedia.length > 0 && (
              <div className="flex space-x-3">
                {config.socialMedia.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center hover:bg-opacity-30 transition-colors"
                    title={social.platform}
                  >
                    <span className="text-sm">{social.icon}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer Sections */}
          {config.sections?.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4" style={{ color: config.textColor || '#ffffff' }}>
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="text-sm opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Section */}
          {config.showNewsletter && (
            <div>
              <h3 className="font-semibold mb-4" style={{ color: config.textColor || '#ffffff' }}>
                Newsletter
              </h3>
              <p className="text-sm opacity-75 mb-4">
                Subscribe to get updates on new products and offers.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-l text-sm placeholder-white placeholder-opacity-75"
                />
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-r text-sm font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white border-opacity-20 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            
            {/* Copyright */}
            <div className="text-sm opacity-75 mb-4 md:mb-0">
              {config.copyright || '© 2024 Your Store. All rights reserved.'}
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6 text-sm opacity-75">
              <a href="/privacy" className="hover:opacity-100 transition-opacity">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:opacity-100 transition-opacity">
                Terms of Service
              </a>
              <a href="/cookies" className="hover:opacity-100 transition-opacity">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}