import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { socket } from '../socket'

const statusSteps = ['Received', 'Preparing', 'On the way', 'Delivered']

export default function OrderStatusPage() {
  const { uuid, orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/orders/${orderId}?roomUuid=${uuid}`)
      .then(res => setOrder(res.data))
      .catch(() => setError(true))

    socket.emit('join_room_channel', uuid)
    socket.on('order_status_updated', (updated) => {
      if (updated._id === orderId) setOrder(updated)
    })
    return () => socket.off('order_status_updated')
  }, [uuid, orderId])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Order not found</h1>
          <Link to={`/room/${uuid}/menu`} className="mt-4 inline-block text-amber-600 underline">Back to menu</Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading order...</p>
      </div>
    )
  }

  const currentStep = statusSteps.indexOf(order.status)

  if (order.status === 'Cancelled') {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Order Cancelled</h1>
          <p className="text-gray-600 mb-4">Your order has been cancelled.</p>
          <Link to={`/room/${uuid}/menu`} className="inline-block rounded-xl bg-amber-600 px-6 py-3 text-white font-semibold">Order again</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-amber-600 mb-2">Order Status</h1>
        <p className="text-sm text-gray-500 mb-6">Room {order.roomNumber} &middot; {new Date(order.createdAt).toLocaleString()}</p>

        <div className="relative mb-8">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
          {statusSteps.map((step, idx) => (
            <div key={step} className="relative mb-6 flex items-center">
              <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${idx <= currentStep ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                {idx + 1}
              </div>
              <span className={`ml-4 font-medium ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
            </div>
          ))}
        </div>

        <h2 className="font-semibold mb-2">Items</h2>
        <ul className="mb-4 space-y-1">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.name}</span>
              <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right font-bold">Total: ${order.total.toFixed(2)}</p>

        <Link to={`/room/${uuid}/menu`} className="mt-6 block w-full rounded-xl bg-gray-100 py-3 text-center font-semibold text-gray-700">Order more</Link>
      </div>
    </div>
  )
}
