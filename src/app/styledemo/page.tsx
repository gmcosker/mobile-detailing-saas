'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { Box, Heading, Text } from '@chakra-ui/react'
import DashboardHomeChakra from '@/components/dashboard/DashboardHomeChakra'
import NextLink from 'next/link'

export default function StyleDemo() {
  return (
    <ChakraProvider>
      <Box minH="100vh" bgGradient="linear(to-br, #f8fafc, #e0e7ff, #c7d2fe)" p={4}>
        {/* Header */}
        <Box mb={8} p={6} bg="white" borderRadius="xl" boxShadow="md">
          <Heading as="h1" size="xl" fontWeight="bold" mb={2} color="gray.900">
            Chakra UI Dashboard Demo
          </Heading>
          <Text color="gray.600" mb={4}>
            Visual comparison - using Chakra UI components
          </Text>
          <NextLink href="/dashboard">
            <Box
              as="span"
              color="blue.600"
              textDecoration="underline"
              fontWeight="500"
              display="inline-block"
              cursor="pointer"
            >
              ← Back to real dashboard
            </Box>
          </NextLink>
        </Box>

        {/* Chakra UI Dashboard */}
        <DashboardHomeChakra />
      </Box>
    </ChakraProvider>
  )
}

