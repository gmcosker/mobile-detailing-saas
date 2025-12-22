'use client'

import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Input,
  Button,
  Badge,
  Center,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import NextLink from 'next/link'
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Plus,
  Car,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Mock data
const mockStats = {
  todayAppointments: 4,
  weekRevenue: 1250,
  totalCustomers: 23,
  pendingAppointments: 7
}

const mockAppointments = [
  { id: '1', time: '9:00 AM', customer: 'John Smith', service: 'Full Detail', status: 'confirmed' },
  { id: '2', time: '11:30 AM', customer: 'Sarah Johnson', service: 'Wash & Wax', status: 'pending' },
  { id: '3', time: '2:00 PM', customer: 'Mike Williams', service: 'Interior Detail', status: 'confirmed' }
]

const mockBookingUrl = 'https://example.com/book/demo-detailer-123'

export default function DashboardHomeChakra() {
  // Using useColorModeValue for Chakra UI v2
  const bgGradient = useColorModeValue(
    'linear(to-br, #f8fafc, #e0e7ff, #c7d2fe)',
    'linear(to-br, #1a202c, #2d3748, #4a5568)'
  )
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.900', 'white')
  const mutedText = useColorModeValue('gray.600', 'gray.400')

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(mockBookingUrl)
    alert('Booking URL copied to clipboard!')
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient} p={{ base: 4, sm: 6 }}>
      <VStack spacing={{ base: 6, sm: 8 }} align="stretch">
        {/* Welcome Header */}
        <Box
          position="relative"
          overflow="hidden"
          bg="whiteAlpha.800"
          backdropFilter="blur(10px)"
          borderRadius={{ base: 'xl', sm: '2xl' }}
          boxShadow="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          p={{ base: 6, sm: 8 }}
          mb={6}
        >
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-r, blue.600/5, indigo.600/5)"
          />
          <Box position="relative">
            <Heading
              as="h1"
              size={{ base: 'xl', sm: '2xl', md: '3xl' }}
              fontWeight="bold"
              bgGradient="linear(to-r, gray.900, gray.700)"
              bgClip="text"
              mb={{ base: 2, sm: 3 }}
            >
              Welcome back! 👋
            </Heading>
            <Text fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} color={mutedText}>
              Here's what's happening with your business today.
            </Text>
          </Box>
        </Box>

        {/* Quick Stats Grid */}
        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={{ base: 4, sm: 6 }} mb={6}>
          <StatCard
            icon={Calendar}
            label="Today"
            value={mockStats.todayAppointments.toString()}
            subtitle="appointments"
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="This Week"
            value={`$${mockStats.weekRevenue}`}
            subtitle="revenue"
            color="green"
          />
          <StatCard
            icon={Users}
            label="Total"
            value={mockStats.totalCustomers.toString()}
            subtitle="customers"
            color="purple"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={mockStats.pendingAppointments.toString()}
            subtitle="appointments"
            color="orange"
          />
        </SimpleGrid>

        {/* Booking URL Card */}
        <Box
          bgGradient="linear(to-r, purple.50, pink.50)"
          backdropFilter="blur(10px)"
          borderRadius={{ base: 'xl', sm: '2xl' }}
          boxShadow="xl"
          border="1px solid"
          borderColor="purple.200/50"
          p={{ base: 6, sm: 8 }}
          mb={6}
        >
          <Heading as="h2" size={{ base: 'lg', sm: 'xl' }} fontWeight="bold" color={textColor} mb={4}>
            Your Booking Page
          </Heading>
          <Text fontSize={{ base: 'sm', sm: 'md' }} color={mutedText} mb={4}>
            Share this link with customers to let them book appointments online:
          </Text>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            gap={4}
            bg="white"
            borderRadius="xl"
            p={4}
            border="1px solid"
            borderColor="purple.200/50"
          >
            <Input
              value={mockBookingUrl}
              readOnly
              bg="transparent"
              color={textColor}
              fontFamily="mono"
              fontSize={{ base: 'xs', sm: 'sm' }}
              minH="44px"
              px={2}
              border="none"
              _focus={{ boxShadow: 'none' }}
            />
            <Button
              onClick={copyBookingUrl}
              bgGradient="linear(to-r, purple.500, pink.600)"
              color="white"
              _hover={{ shadow: 'lg' }}
              transition="all 0.3s"
              h={{ base: '48px', sm: '44px' }}
              w={{ base: '100%', sm: 'auto' }}
            >
              Copy Link
            </Button>
          </Flex>
          <Box mt={4}>
            <Box
              as="a"
              href={mockBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              color="purple.600"
              _hover={{ color: 'purple.700' }}
              fontWeight="semibold"
              textDecoration="underline"
              fontSize={{ base: 'sm', sm: 'md' }}
              cursor="pointer"
            >
              Preview booking page →
            </Box>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box
          bg="whiteAlpha.900"
          backdropFilter="blur(10px)"
          borderRadius={{ base: 'xl', sm: '2xl' }}
          boxShadow="xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          p={{ base: 6, sm: 8 }}
          mb={6}
        >
          <Heading as="h2" size={{ base: 'lg', sm: 'xl' }} fontWeight="bold" color={textColor} mb={6}>
            Quick Actions
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, sm: 6 }}>
            <ActionCard
              icon={Plus}
              title="New Appointment"
              subtitle="Schedule a new service"
              color="blue"
              href="/schedule"
            />
            <ActionCard
              icon={Users}
              title="Add Customer"
              subtitle="Create new customer profile"
              color="green"
              href="/customers"
            />
          </SimpleGrid>
        </Box>

        {/* Today's Schedule */}
        <Box
          bg="whiteAlpha.900"
          backdropFilter="blur(10px)"
          borderRadius={{ base: 'xl', sm: '2xl' }}
          boxShadow="xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          p={{ base: 6, sm: 8 }}
          mb={6}
        >
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'start', sm: 'center' }}
            justify="space-between"
            gap={4}
            mb={6}
          >
            <Heading as="h2" size={{ base: 'lg', sm: 'xl' }} fontWeight="bold" color={textColor}>
              Today's Schedule
            </Heading>
            <Button
              as={NextLink}
              href="/schedule"
              bgGradient="linear(to-r, blue.500, indigo.600)"
              color="white"
              fontWeight="semibold"
              borderRadius="xl"
              _hover={{ shadow: 'lg' }}
              transition="all 0.3s"
              minH="44px"
              w={{ base: '100%', sm: 'auto' }}
            >
              View All
            </Button>
          </Flex>

          <Box spacing={4}>
            {mockAppointments.length > 0 ? (
              mockAppointments.map((appointment) => (
                <AppointmentCardChakra key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <Center py={8}>
                <Box textAlign="center">
                  <Box mb={4} mx="auto" display="flex" justifyContent="center">
                    <Calendar size={48} color="#9CA3AF" />
                  </Box>
                  <Text color={mutedText} fontSize={{ base: 'md', sm: 'lg' }}>
                    No appointments scheduled for today
                  </Text>
                  <Text color="gray.500" fontSize={{ base: 'sm', sm: 'md' }}>
                    Great time to catch up on other tasks!
                  </Text>
                </Box>
              </Center>
            )}
          </Box>
        </Box>

        {/* Recent Activity */}
        <Box
          bg="whiteAlpha.900"
          backdropFilter="blur(10px)"
          borderRadius={{ base: 'xl', sm: '2xl' }}
          boxShadow="xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          p={{ base: 6, sm: 8 }}
        >
          <Heading as="h2" size={{ base: 'lg', sm: 'xl' }} fontWeight="bold" color={textColor} mb={6}>
            Recent Activity
          </Heading>
          <Center py={8}>
            <Box textAlign="center">
              <Text color={mutedText} fontSize={{ base: 'md', sm: 'lg' }}>
                No recent activity
              </Text>
              <Text color="gray.500" fontSize={{ base: 'sm', sm: 'md' }}>
                Activity will appear here as you use the app
              </Text>
            </Box>
          </Center>
        </Box>
      </VStack>
    </Box>
  )
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color
}: {
  icon: any
  label: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorConfig = {
    blue: {
      gradient: 'linear(to-br, blue.500, blue.600)',
      bg: 'linear(to-br, blue.50, indigo.50)',
      border: 'blue.200/50'
    },
    green: {
      gradient: 'linear(to-br, emerald.500, emerald.600)',
      bg: 'linear(to-br, emerald.50, green.50)',
      border: 'emerald.200/50'
    },
    purple: {
      gradient: 'linear(to-br, purple.500, purple.600)',
      bg: 'linear(to-br, purple.50, violet.50)',
      border: 'purple.200/50'
    },
    orange: {
      gradient: 'linear(to-br, amber.500, amber.600)',
      bg: 'linear(to-br, amber.50, orange.50)',
      border: 'amber.200/50'
    }
  }

  const config = colorConfig[color]

  return (
    <Box
      position="relative"
      overflow="hidden"
      bgGradient={config.bg}
      backdropFilter="blur(10px)"
      borderRadius={{ base: 'xl', sm: '2xl' }}
      boxShadow="lg"
      border="1px solid"
      borderColor={config.border}
      p={{ base: 4, sm: 6 }}
      _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
      transition="all 0.3s"
    >
      <Box
        position="absolute"
        inset={0}
        bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)"
        _hover={{ bgGradient: 'linear(to-br, whiteAlpha.300, whiteAlpha.100)' }}
        transition="all 0.3s"
      />
      <Box position="relative">
        <Flex align="center" gap={{ base: 3, sm: 4 }} mb={{ base: 3, sm: 4 }}>
          <Box
            p={{ base: 2, sm: 3 }}
            bgGradient={config.gradient}
            borderRadius={{ base: 'lg', sm: 'xl' }}
            boxShadow="lg"
            _hover={{ transform: 'scale(1.1)' }}
            transition="transform 0.3s"
          >
            <Icon size={24} color="white" />
          </Box>
          <Text
            fontSize={{ base: 'xs', sm: 'sm' }}
            fontWeight="semibold"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {label}
          </Text>
        </Flex>
        <Box spacing={1}>
          <Text
            fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
            fontWeight="bold"
            color="gray.900"
          >
            {value}
          </Text>
          <Text fontSize={{ base: 'xs', sm: 'sm' }} color="gray.600" fontWeight="medium">
            {subtitle}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}

// Action Card Component
function ActionCard({
  icon: Icon,
  title,
  subtitle,
  color,
  href
}: {
  icon: any
  title: string
  subtitle: string
  color: 'blue' | 'green'
  href: string
}) {
  const colorConfig = {
    blue: {
      gradient: 'linear(to-r, blue.50, indigo.50)',
      iconGradient: 'linear(to-br, blue.500, blue.600)',
      border: 'blue.200/50'
    },
    green: {
      gradient: 'linear(to-r, emerald.50, green.50)',
      iconGradient: 'linear(to-br, emerald.500, emerald.600)',
      border: 'emerald.200/50'
    }
  }

  const config = colorConfig[color]

  return (
    <Box
      as={NextLink}
      href={href}
      position="relative"
      overflow="hidden"
      display="flex"
      align="center"
      minH={{ base: '80px', sm: '100px' }}
      p={{ base: 4, sm: 6 }}
      bgGradient={config.gradient}
      border="1px solid"
      borderColor={config.border}
      borderRadius={{ base: 'xl', sm: '2xl' }}
      _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
      transition="all 0.3s"
      cursor="pointer"
    >
      <Box
        p={{ base: 3, sm: 4 }}
        bgGradient={config.iconGradient}
        borderRadius="xl"
        boxShadow="lg"
        _hover={{ transform: 'scale(1.1)' }}
        transition="transform 0.3s"
      >
        <Icon size={32} color="white" />
      </Box>
      <Box ml={{ base: 4, sm: 6 }} textAlign="left">
        <Text fontWeight="bold" color="gray.900" fontSize={{ base: 'lg', sm: 'xl' }}>
          {title}
        </Text>
        <Text fontSize={{ base: 'sm', sm: 'md' }} color="gray.600">
          {subtitle}
        </Text>
      </Box>
    </Box>
  )
}

// Appointment Card Component
function AppointmentCardChakra({ appointment }: { appointment: any }) {
  const statusConfig = {
    confirmed: {
      gradient: 'linear(to-r, emerald.500, emerald.600)',
      bg: 'linear(to-r, emerald.50, green.50)',
      border: 'emerald.200/50',
      text: 'emerald.700'
    },
    pending: {
      gradient: 'linear(to-r, amber.500, amber.600)',
      bg: 'linear(to-r, amber.50, orange.50)',
      border: 'amber.200/50',
      text: 'amber.700'
    },
    cancelled: {
      gradient: 'linear(to-r, red.500, red.600)',
      bg: 'linear(to-r, red.50, rose.50)',
      border: 'red.200/50',
      text: 'red.700'
    }
  }

  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Box
      position="relative"
      overflow="hidden"
      bgGradient={config.bg}
      backdropFilter="blur(10px)"
      borderRadius={{ base: 'xl', sm: '2xl' }}
      boxShadow="lg"
      border="1px solid"
      borderColor={config.border}
      p={{ base: 4, sm: 6 }}
      mb={4}
      _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
      transition="all 0.3s"
    >
      <Box
        position="absolute"
        inset={0}
        bgGradient="linear(to-r, whiteAlpha.200, whiteAlpha.50)"
        _hover={{ bgGradient: 'linear(to-r, whiteAlpha.300, whiteAlpha.100)' }}
        transition="all 0.3s"
      />
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'start', sm: 'center' }}
        justify="space-between"
        gap={3}
        position="relative"
      >
        <Flex align="center" gap={{ base: 3, sm: 4 }} flex={1}>
          <Box
            p={{ base: 2, sm: 3 }}
            bgGradient="linear(to-br, blue.500, blue.600)"
            borderRadius={{ base: 'lg', sm: 'xl' }}
            boxShadow="lg"
            _hover={{ transform: 'scale(1.1)' }}
            transition="transform 0.3s"
          >
            <Car size={24} color="white" />
          </Box>
          <Box flex={1} minW={0}>
            <Text fontWeight="bold" color="gray.900" fontSize={{ base: 'md', sm: 'lg' }} isTruncated>
              {appointment.customer}
            </Text>
            <Text color="gray.600" fontWeight="medium" fontSize={{ base: 'sm', sm: 'md' }} isTruncated>
              {appointment.service}
            </Text>
          </Box>
        </Flex>
        <Box textAlign={{ base: 'left', sm: 'right' }} w={{ base: '100%', sm: 'auto' }}>
          <Text fontWeight="bold" color="gray.900" fontSize={{ base: 'md', sm: 'lg' }}>
            {appointment.time}
          </Text>
          <Badge
            fontSize={{ base: 'xs', sm: 'sm' }}
            fontWeight="semibold"
            px={{ base: 3, sm: 4 }}
            py={{ base: 1.5, sm: 2 }}
            borderRadius="full"
            bgGradient={config.gradient}
            color="white"
            boxShadow="lg"
            mt={1}
            display="inline-block"
          >
            {appointment.status}
          </Badge>
        </Box>
      </Flex>
    </Box>
  )
}

