'use client'

import { useState, useEffect } from 'react'
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
  Car,
  Loader2
} from 'lucide-react'
import { detailerService, appointmentService, customerService, brandingService } from '@/lib/database'

interface BookingPageProps {
  detailerId: string
}

// Default services if detailer data fails to load
const defaultServices = [
  { id: 1, name: 'Basic Wash', price: 25, duration: 30 },
  { id: 2, name: 'Wash & Wax', price: 45, duration: 60 },
  { id: 3, name: 'Full Detail', price: 150, duration: 180 },
  { id: 4, name: 'Interior Detail', price: 75, duration: 120 }
]

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
  
  // Real data state
  const [detailer, setDetailer] = useState<any>(null)
  const [branding, setBranding] = useState<any>(null)
  const [services, setServices] = useState(defaultServices)
  const [bookedSlots, setBookedSlots] = useState<{date: string, time: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Get custom CSS variables based on branding
  const getCustomStyles = () => {
    if (!branding) return {}
    
    return {
      '--primary-color': branding.primary_color || '#3B82F6',
      '--secondary-color': branding.secondary_color || '#F3F4F6',
      '--text-color': branding.text_color || '#1F2937',
      '--font-family': branding.font_family || 'Inter'
    } as React.CSSProperties
  }

  // Load detailer data, branding, and booked slots
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load detailer info
        const detailerData = await detailerService.getByDetailerId(detailerId)
        if (detailerData) {
          setDetailer(detailerData)
        }

        // Load branding info
        const brandingData = await brandingService.getByDetailerId(detailerId)
        if (brandingData) {
          setBranding(brandingData)
        }

        // Load booked slots for the next 7 days
        const startDate = nextSevenDays[0].toISOString().split('T')[0]
        const endDate = nextSevenDays[6].toISOString().split('T')[0]
        const booked = await appointmentService.getBookedSlots(detailerId, startDate, endDate)
        setBookedSlots(booked)
      } catch (error) {
        console.error('Error loading booking data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [detailerId])

  // Check if a time slot is available
  const isSlotAvailable = (date: Date, time: string): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    const timeStr = time === '8:00 AM' ? '08:00:00' :
                   time === '9:00 AM' ? '09:00:00' :
                   time === '10:00 AM' ? '10:00:00' :
                   time === '11:00 AM' ? '11:00:00' :
                   time === '1:00 PM' ? '13:00:00' :
                   time === '2:00 PM' ? '14:00:00' :
                   time === '3:00 PM' ? '15:00:00' :
                   time === '4:00 PM' ? '16:00:00' :
                   time === '5:00 PM' ? '17:00:00' : time

    return !bookedSlots.some(slot => 
      slot.date === dateStr && slot.time === timeStr
    )
  }

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep(3)
    }
  }

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !detailer) return
    
    setSubmitting(true)
    try {
      // Convert time to database format
      const timeStr = selectedTime === '8:00 AM' ? '08:00:00' :
                     selectedTime === '9:00 AM' ? '09:00:00' :
                     selectedTime === '10:00 AM' ? '10:00:00' :
                     selectedTime === '11:00 AM' ? '11:00:00' :
                     selectedTime === '1:00 PM' ? '13:00:00' :
                     selectedTime === '2:00 PM' ? '14:00:00' :
                     selectedTime === '3:00 PM' ? '15:00:00' :
                     selectedTime === '4:00 PM' ? '16:00:00' :
                     selectedTime === '5:00 PM' ? '17:00:00' : selectedTime

      // Check if customer already exists
      let customer = await customerService.findByPhoneOrEmail(customerInfo.phone, customerInfo.email)
      
      if (!customer) {
        // Create new customer
        customer = await customerService.create({
          name: customerInfo.name,
          email: customerInfo.email || null,
          phone: customerInfo.phone,
          address: customerInfo.address,
          notes: customerInfo.notes
        })
      }

      if (!customer) {
        throw new Error('Failed to create or find customer')
      }

      // Create appointment
      const appointment = await appointmentService.create({
        detailer_id: detailer.id,
        customer_id: customer.id,
        scheduled_date: selectedDate.toISOString().split('T')[0],
        scheduled_time: timeStr,
        service_type: selectedService.name,
        total_amount: selectedService.price,
        status: 'pending',
        payment_status: 'pending',
        notes: customerInfo.notes
      })

      if (!appointment) {
        throw new Error('Failed to create appointment')
      }

      console.log('Booking created successfully:', appointment)
      setStep(4)
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking options...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      style={getCustomStyles()}
    >
      {/* Header */}
      <header className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-2xl border-b border-white/20 px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setStep(step - 1)}
                className="p-3 bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                {branding?.logo_url && (
                  <div className="p-2 bg-white/80 rounded-2xl shadow-lg">
                    <img
                      src={branding.logo_url}
                      alt="Business Logo"
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 
                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                    style={{ 
                      color: branding?.text_color || undefined,
                      fontFamily: branding?.font_family || undefined
                    }}
                  >
                    {detailer?.business_name || 'Auto Detailing Service'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">4.9 (127 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
                    stepNum === step 
                      ? 'text-white scale-110' 
                      : stepNum < step 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                      : 'bg-white/80 text-gray-500 border border-gray-200'
                  }`}
                  style={{
                    background: stepNum === step 
                      ? `linear-gradient(135deg, ${branding?.primary_color || '#3B82F6'}, ${branding?.secondary_color || '#1E40AF'})`
                      : undefined
                  }}
                >
                  {stepNum < step ? <Check className="h-5 w-5" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 mx-3 rounded-full transition-all duration-300 ${
                    stepNum < step 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm font-semibold text-gray-600">
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
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                  style={{
                    borderColor: 'var(--primary-color, #3B82F6)',
                    fontFamily: branding?.font_family || undefined
                  }}
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
                          ? 'text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                      style={{
                        borderColor: selectedDate?.toDateString() === date.toDateString()
                          ? (branding?.primary_color || '#3B82F6')
                          : undefined,
                        backgroundColor: selectedDate?.toDateString() === date.toDateString()
                          ? `${branding?.primary_color || '#3B82F6'}20`
                          : undefined,
                        color: selectedDate?.toDateString() === date.toDateString()
                          ? (branding?.primary_color || '#3B82F6')
                          : undefined,
                        fontFamily: branding?.font_family || undefined
                      }}
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
                    {timeSlots.map((time) => {
                      const isAvailable = isSlotAvailable(selectedDate, time)
                      const isSelected = selectedTime === time
                      
                      return (
                        <button
                          key={time}
                          onClick={() => isAvailable && setSelectedTime(time)}
                          disabled={!isAvailable}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            isSelected
                              ? 'text-primary'
                              : isAvailable
                              ? 'border-border bg-card text-foreground hover:border-primary/50'
                              : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          }`}
                          style={{
                            borderColor: isSelected
                              ? (branding?.primary_color || '#3B82F6')
                              : undefined,
                            backgroundColor: isSelected
                              ? `${branding?.primary_color || '#3B82F6'}20`
                              : undefined,
                            color: isSelected
                              ? (branding?.primary_color || '#3B82F6')
                              : undefined,
                            fontFamily: branding?.font_family || undefined
                          }}
                        >
                          {time}
                          {!isAvailable && (
                            <div className="text-xs text-muted-foreground mt-1">Booked</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <Button 
                  onClick={handleDateTimeSelect} 
                  className="w-full"
                  style={{
                    backgroundColor: branding?.primary_color || '#3B82F6',
                    fontFamily: branding?.font_family || undefined
                  }}
                >
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
                disabled={!customerInfo.name || !customerInfo.phone || !customerInfo.address || submitting}
                style={{
                  backgroundColor: branding?.primary_color || '#3B82F6',
                  fontFamily: branding?.font_family || undefined
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Book Appointment'
                )}
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
                  Questions? Call {detailer?.phone || '(555) 123-4567'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}



