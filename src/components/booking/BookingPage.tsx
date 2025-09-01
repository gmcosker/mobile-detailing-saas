'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Check,
  ArrowLeft,
  Car
} from 'lucide-react'

interface BookingPageProps {
  detailerId: string
}

// Mock data - in real app this would come from database
const mockDetailer = {
  businessName: 'Premium Auto Detailing',
  contactName: 'John Smith',
  rating: 4.9,
  reviewCount: 127,
  phone: '(555) 123-4567',
  email: 'john@premiumauto.com',
  services: [
    { id: 1, name: 'Basic Wash', price: 25, duration: 30 },
    { id: 2, name: 'Wash & Wax', price: 45, duration: 60 },
    { id: 3, name: 'Full Detail', price: 150, duration: 180 },
    { id: 4, name: 'Interior Detail', price: 75, duration: 120 }
  ]
}

const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
]

const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + i + 1) // Start from tomorrow
  return date
})

export default function BookingPage({ detailerId }: BookingPageProps) {
  const [step, setStep] = useState(1) // 1: Service, 2: Date/Time, 3: Details, 4: Confirmation
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep(3)
    }
  }

  const handleBookingSubmit = () => {
    // Here we would submit to the database
    console.log('Booking submitted:', {
      detailerId,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      customer: customerInfo
    })
    setStep(4)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                {mockDetailer.businessName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{mockDetailer.rating}</span>
                  <span>({mockDetailer.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum === step 
                    ? 'bg-primary text-primary-foreground' 
                    : stepNum < step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum < step ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-8 h-0.5 ${stepNum < step ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Service</span>
            <span>Date & Time</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 pb-8">
        <div className="max-w-md mx-auto">
          
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Choose Your Service
              </h2>
              {mockDetailer.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">${service.price}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Select Date & Time
                </h2>
                <div className="text-sm text-muted-foreground mb-4">
                  {selectedService?.name} - ${selectedService?.price} ({selectedService?.duration} min)
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Choose Date</h3>
                <div className="grid grid-cols-2 gap-2">
                  {nextSevenDays.map((date, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-sm">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h3 className="font-medium text-foreground mb-3">Choose Time</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedTime === time
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <Button onClick={handleDateTimeSelect} className="w-full">
                  Continue to Details
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Customer Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Your Information
              </h2>
              
              {/* Booking Summary */}
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="text-sm text-muted-foreground mb-2">Booking Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground">{selectedService?.name}</span>
                    <span className="font-medium">${selectedService?.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-muted-foreground">{selectedTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                />
                <textarea
                  placeholder="Service Address *"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground h-20 resize-none"
                  required
                />
                <textarea
                  placeholder="Special Instructions (optional)"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground h-20 resize-none"
                />
              </div>

              <Button 
                onClick={handleBookingSubmit}
                className="w-full"
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address}
              >
                Book Appointment
              </Button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-muted-foreground">
                  Your appointment has been successfully booked.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4 text-left">
                <h3 className="font-semibold text-foreground mb-3">Appointment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="text-foreground">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">
                      {selectedDate?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="text-foreground">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="text-foreground font-medium">${selectedService?.price}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  📱 You'll receive a text reminder 24 hours before your appointment
                </p>
                <p className="text-sm text-muted-foreground">
                  Questions? Call {mockDetailer.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


