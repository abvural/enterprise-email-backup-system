import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Text,
  Select,
  Button,
  TabPanel,
  HStack,
} from '@chakra-ui/react'
import type { UseFormReturn } from 'react-hook-form'

// Office 365 Panel Component
export const Office365Panel = ({ 
  form, 
  onSubmit 
}: { 
  form: UseFormReturn<any>
  onSubmit: (data: any) => void 
}) => {
  const handleOAuth = () => {
    const clientId = process.env.REACT_APP_OFFICE365_CLIENT_ID || 'your_client_id'
    const tenantId = process.env.REACT_APP_OFFICE365_TENANT_ID || 'common'
    const redirectUri = encodeURIComponent('http://localhost:8081/api/oauth/office365/callback')
    const scope = encodeURIComponent('https://graph.microsoft.com/Mail.Read offline_access')
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_mode=query&` +
      `state=${Date.now()}`
    
    window.location.href = authUrl
  }

  return (
    <TabPanel px={0} py={0}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <VStack spacing={5} align="stretch">
          <Alert status="info" borderRadius="6px" bg="blue.50" border="1px solid" borderColor="blue.200">
            <AlertIcon color="blue.500" />
            <Text fontSize="sm" color="blue.700">
              Connect to Office 365 using Microsoft OAuth 2.0 for secure access.
            </Text>
          </Alert>

          <FormControl isInvalid={!!form.formState.errors.email}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
              Office 365 Email Address
            </FormLabel>
            <Input
              {...form.register('email')}
              placeholder="your.email@company.com"
              type="email"
              fontSize="md"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="6px"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none',
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="sm" color="red.500">
              {form.formState.errors.email?.message}
            </FormErrorMessage>
          </FormControl>

          <Button
            type="button"
            onClick={handleOAuth}
            variant="solid"
            size="md"
            width="full"
          >
            Authorize with Microsoft
          </Button>
        </VStack>
      </form>
    </TabPanel>
  )
}

// IMAP Panel Component
export const IMAPPanel = ({ 
  form, 
  onSubmit 
}: { 
  form: UseFormReturn<any>
  onSubmit: (data: any) => void 
}) => {
  const provider = form.watch('provider')
  const showCustomSettings = provider === 'custom_imap'

  return (
    <TabPanel px={0} py={0}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <VStack spacing={5} align="stretch">
          <Alert status="info" borderRadius="6px" bg="blue.50" border="1px solid" borderColor="blue.200">
            <AlertIcon color="blue.500" />
            <Text fontSize="sm" color="blue.700">
              Connect to Yahoo, Outlook.com, or any IMAP-compatible email service.
            </Text>
          </Alert>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
              Email Provider
            </FormLabel>
            <Select
              {...form.register('provider')}
              fontSize="md"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="6px"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none',
                bg: 'white',
              }}
            >
              <option value="yahoo">Yahoo Mail</option>
              <option value="outlook">Outlook.com</option>
              <option value="custom_imap">Custom IMAP Server</option>
            </Select>
          </FormControl>

          <FormControl isInvalid={!!form.formState.errors.email}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
              Email Address
            </FormLabel>
            <Input
              {...form.register('email')}
              placeholder={
                provider === 'yahoo' ? 'your.email@yahoo.com' :
                provider === 'outlook' ? 'your.email@outlook.com' :
                'your.email@domain.com'
              }
              type="email"
              fontSize="md"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="6px"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none',
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="sm" color="red.500">
              {form.formState.errors.email?.message}
            </FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!form.formState.errors.password}>
            <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
              {provider === 'yahoo' ? 'App Password' : 'Password'}
            </FormLabel>
            <Input
              {...form.register('password')}
              placeholder={
                provider === 'yahoo' ? 'Enter Yahoo app password' :
                provider === 'outlook' ? 'Enter Outlook password' :
                'Enter your password'
              }
              type="password"
              fontSize="md"
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="6px"
              _focus={{
                borderColor: 'gray.400',
                boxShadow: 'none',
                bg: 'white',
              }}
            />
            <FormErrorMessage fontSize="sm" color="red.500">
              {form.formState.errors.password?.message}
            </FormErrorMessage>
          </FormControl>

          {showCustomSettings && (
            <>
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                    IMAP Server
                  </FormLabel>
                  <Input
                    {...form.register('imap_server')}
                    placeholder="imap.example.com"
                    fontSize="md"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="6px"
                    _focus={{
                      borderColor: 'gray.400',
                      boxShadow: 'none',
                      bg: 'white',
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                    Port
                  </FormLabel>
                  <Input
                    {...form.register('imap_port')}
                    placeholder="993"
                    fontSize="md"
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="6px"
                    _focus={{
                      borderColor: 'gray.400',
                      boxShadow: 'none',
                      bg: 'white',
                    }}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.900" mb={2}>
                  Security
                </FormLabel>
                <Select
                  {...form.register('security')}
                  fontSize="md"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="6px"
                  _focus={{
                    borderColor: 'gray.400',
                    boxShadow: 'none',
                    bg: 'white',
                  }}
                >
                  <option value="SSL">SSL</option>
                  <option value="TLS">TLS</option>
                  <option value="STARTTLS">STARTTLS</option>
                  <option value="NONE">None</option>
                </Select>
              </FormControl>
            </>
          )}
        </VStack>
      </form>
    </TabPanel>
  )
}