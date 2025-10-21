'use client'

import type { CartWidget as CartWidgetType } from '@/types/apps/shopifyWidgets'

interface CartWidgetProps {
  widget: CartWidgetType
}

export default function CartWidget({ widget }: CartWidgetProps) {
  const { config } = widget

  // Mock cart data for demonstration
  const cartItems = [
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 79.99,
      quantity: 1,
      image: 'https://via.placeholder.com/80x80'
    },
    {
      id: '2',
      name: 'Smartphone Case',
      price: 24.99,
      quantity: 2,
      image: 'https://via.placeholder.com/80x80'
    }
  ]

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <section className="w-full py-8 px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Cart Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <span>{config.cartIcon || '🛒'}</span>
            Shopping Cart
          </h2>
          {config.showItemCount && (
            <p className="text-gray-600">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm border">
          {cartItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🛒</div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add some products to get started</p>
              <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    {/* Product Image */}
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">${item.price}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded border hover:bg-gray-50 flex items-center justify-center">
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button className="w-8 h-8 rounded border hover:bg-gray-50 flex items-center justify-center">
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      <button className="text-xs text-red-600 hover:text-red-800">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Buttons */}
                <div className="mt-4 space-y-2">
                  <button 
                    className="w-full py-3 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: config.backgroundColor || '#7C3AED',
                      color: config.textColor || '#ffffff'
                    }}
                  >
                    Proceed to Checkout
                  </button>
                  <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Trust Signals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚚</span>
            <span>Free Shipping</span>
          </div>
          <div className="flex items-center gap-1">
            <span>↩️</span>
            <span>Easy Returns</span>
          </div>
        </div>
      </div>
    </section>
  )
}