import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Avatar,
  Badge,
  IconButton,
  Button,
  Divider,
  Grid,
  GridItem,
  Heading,
  Container,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import {
  FiStar,
  FiArchive,
  FiTrash2,
  FiMoreVertical,
  FiPaperclip,
  FiTag,
  FiClock,
  FiChevronDown,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiInbox,
  FiSend,
  FiFile,
  FiAlertCircle,
  FiCheckCircle,
  FiFolder,
  FiMail,
  FiEdit3,
} from 'react-icons/fi';

// Sample email data
const sampleEmails = [
  {
    id: 1,
    sender: 'John Doe',
    senderEmail: 'john.doe@company.com',
    subject: 'Q4 Budget Review - Action Required',
    preview: 'Hi team, I wanted to follow up on our discussion about the Q4 budget. We need to finalize the numbers by end of week...',
    time: '10:30 AM',
    date: 'Today',
    unread: true,
    starred: false,
    hasAttachment: true,
    important: true,
    category: 'Work',
  },
  {
    id: 2,
    sender: 'Sarah Wilson',
    senderEmail: 'sarah@designstudio.com',
    subject: 'New Design Mockups Ready',
    preview: 'Hey! The new mockups for the dashboard redesign are ready for review. I\'ve incorporated all the feedback from last meeting...',
    time: '9:15 AM',
    date: 'Today',
    unread: true,
    starred: true,
    hasAttachment: true,
    important: false,
    category: 'Projects',
  },
  {
    id: 3,
    sender: 'GitHub',
    senderEmail: 'notifications@github.com',
    subject: '[PR] Feature: Add user authentication',
    preview: 'Pull request #142 has been merged into main branch. This PR adds complete user authentication system with JWT tokens...',
    time: 'Yesterday',
    date: 'Jan 11',
    unread: false,
    starred: false,
    hasAttachment: false,
    important: false,
    category: 'Development',
  },
  {
    id: 4,
    sender: 'Marketing Team',
    senderEmail: 'marketing@company.com',
    subject: 'Campaign Results - December 2024',
    preview: 'Great news! Our December campaign exceeded targets by 23%. Here\'s the detailed breakdown of metrics and ROI...',
    time: '4:45 PM',
    date: 'Jan 11',
    unread: false,
    starred: true,
    hasAttachment: true,
    important: false,
    category: 'Marketing',
  },
  {
    id: 5,
    sender: 'Alex Chen',
    senderEmail: 'alex.chen@techcorp.com',
    subject: 'Meeting Notes: API Integration Discussion',
    preview: 'Thanks for the productive meeting today. I\'ve summarized our discussion points and next steps for the API integration...',
    time: '2:30 PM',
    date: 'Jan 10',
    unread: false,
    starred: false,
    hasAttachment: false,
    important: false,
    category: 'Meetings',
  },
];

// Gmail Style Component
const GmailStyle = () => {
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const toggleEmailSelection = (id: number) => {
    setSelectedEmails(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <Box bg={bgColor} borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
      {/* Gmail Toolbar */}
      <HStack
        px={4}
        py={2}
        borderBottom="1px"
        borderColor={borderColor}
        spacing={2}
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        <Checkbox />
        <IconButton
          aria-label="Archive"
          icon={<FiArchive />}
          size="sm"
          variant="ghost"
        />
        <IconButton
          aria-label="Report Spam"
          icon={<FiAlertCircle />}
          size="sm"
          variant="ghost"
        />
        <IconButton
          aria-label="Delete"
          icon={<FiTrash2 />}
          size="sm"
          variant="ghost"
        />
        <Divider orientation="vertical" h="20px" />
        <IconButton
          aria-label="Mark as read"
          icon={<FiMail />}
          size="sm"
          variant="ghost"
        />
        <IconButton
          aria-label="Snooze"
          icon={<FiClock />}
          size="sm"
          variant="ghost"
        />
        <Divider orientation="vertical" h="20px" />
        <IconButton
          aria-label="More"
          icon={<FiMoreVertical />}
          size="sm"
          variant="ghost"
        />
        <Flex flex={1} />
        <Text fontSize="sm" color="gray.600">1-50 of 234</Text>
        <HStack spacing={0}>
          <IconButton
            aria-label="Previous"
            icon={<FiChevronDown style={{ transform: 'rotate(90deg)' }} />}
            size="sm"
            variant="ghost"
          />
          <IconButton
            aria-label="Next"
            icon={<FiChevronDown style={{ transform: 'rotate(-90deg)' }} />}
            size="sm"
            variant="ghost"
          />
        </HStack>
      </HStack>

      {/* Email List */}
      <VStack spacing={0} align="stretch">
        {sampleEmails.map((email) => (
          <HStack
            key={email.id}
            px={4}
            py={3}
            _hover={{ bg: hoverBg }}
            cursor="pointer"
            borderBottom="1px"
            borderColor={borderColor}
            spacing={3}
            bg={email.unread ? useColorModeValue('white', 'gray.800') : 'transparent'}
          >
            <Checkbox
              isChecked={selectedEmails.includes(email.id)}
              onChange={() => toggleEmailSelection(email.id)}
            />
            <IconButton
              aria-label="Star"
              icon={<FiStar fill={email.starred ? '#f59e0b' : 'none'} />}
              size="sm"
              variant="ghost"
              color={email.starred ? 'yellow.500' : 'gray.400'}
            />
            {email.important && (
              <Badge colorScheme="yellow" size="sm">Important</Badge>
            )}
            <Text
              fontWeight={email.unread ? '600' : '400'}
              fontSize="14px"
              minW="180px"
            >
              {email.sender}
            </Text>
            <Box flex={1}>
              <HStack spacing={2}>
                <Text
                  fontWeight={email.unread ? '600' : '400'}
                  fontSize="14px"
                  noOfLines={1}
                >
                  {email.subject}
                </Text>
                <Text fontSize="14px" color="gray.600" noOfLines={1}>
                  - {email.preview}
                </Text>
              </HStack>
            </Box>
            {email.hasAttachment && (
              <Icon as={FiPaperclip} color="gray.400" boxSize={4} />
            )}
            <Text fontSize="13px" color="gray.600" minW="60px" textAlign="right">
              {email.time}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

// Office 365 / Outlook Style Component
const OutlookStyle = () => {
  const [selectedEmail, setSelectedEmail] = useState(sampleEmails[0]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const folderHoverBg = useColorModeValue('gray.50', 'gray.700');
  const folderSelectedBg = useColorModeValue('gray.100', 'gray.600');

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: FiInbox, count: 5 },
    { id: 'sent', label: 'Sent Items', icon: FiSend, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FiFile, count: 2 },
    { id: 'deleted', label: 'Deleted Items', icon: FiTrash2, count: 0 },
    { id: 'archive', label: 'Archive', icon: FiArchive, count: 0 },
    { id: 'junk', label: 'Junk Email', icon: FiAlertCircle, count: 1 },
  ];

  return (
    <Flex h="500px" bg={bgColor} borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
      {/* Folder Panel */}
      <Box w="200px" borderRight="1px" borderColor={borderColor} bg={useColorModeValue('gray.50', 'gray.900')}>
        {/* Account Selector */}
        <Box px={3} py={3} borderBottom="1px" borderColor={borderColor}>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              width="full"
              textAlign="left"
              rightIcon={<FiChevronDown />}
              variant="ghost"
              fontWeight="500"
              fontSize="13px"
            >
              john@company.com
            </MenuButton>
            <MenuList fontSize="13px">
              <MenuItem icon={<FiMail />}>john@company.com</MenuItem>
              <MenuItem icon={<FiMail />}>sarah@gmail.com</MenuItem>
              <MenuItem icon={<FiMail />}>team@outlook.com</MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiEdit3 />}>Add account...</MenuItem>
            </MenuList>
          </Menu>
        </Box>
        {/* Favorites Section */}
        <Box>
          <Box px={3} py={2}>
            <Text fontSize="11px" fontWeight="600" color="gray.500" letterSpacing="0.05em">
              FAVORITES
            </Text>
          </Box>
          <VStack spacing={0} align="stretch" pb={2}>
            <HStack
              px={3}
              py={1.5}
              cursor="pointer"
              _hover={{ bg: folderHoverBg }}
            >
              <Icon as={FiStar} boxSize={3.5} color="yellow.500" />
              <Text fontSize="13px">Important</Text>
            </HStack>
            <HStack
              px={3}
              py={1.5}
              cursor="pointer"
              _hover={{ bg: folderHoverBg }}
            >
              <Icon as={FiClock} boxSize={3.5} color="blue.500" />
              <Text fontSize="13px">Scheduled</Text>
            </HStack>
          </VStack>
        </Box>
        
        <Divider borderColor={borderColor} />
        
        {/* Folders Section */}
        <Box px={3} py={2}>
          <Text fontSize="11px" fontWeight="600" color="gray.500" letterSpacing="0.05em">
            FOLDERS
          </Text>
        </Box>
        <VStack spacing={0} align="stretch">
          {folders.map((folder) => (
            <HStack
              key={folder.id}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: folderHoverBg }}
              bg={selectedFolder === folder.id ? folderSelectedBg : 'transparent'}
              onClick={() => setSelectedFolder(folder.id)}
              justify="space-between"
            >
              <HStack spacing={2}>
                <Icon 
                  as={folder.icon} 
                  boxSize={4} 
                  color={selectedFolder === folder.id ? 'blue.600' : 'gray.500'}
                />
                <Text 
                  fontSize="13px" 
                  fontWeight={selectedFolder === folder.id ? '500' : '400'}
                  color={selectedFolder === folder.id ? 'blue.600' : 'inherit'}
                >
                  {folder.label}
                </Text>
              </HStack>
              {folder.count > 0 && (
                <Badge size="sm" colorScheme="gray" borderRadius="full" fontSize="11px">
                  {folder.count}
                </Badge>
              )}
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* Email List Panel */}
      <Box w="35%" borderRight="1px" borderColor={borderColor}>
        {/* Outlook Toolbar */}
        <HStack px={3} py={2} borderBottom="1px" borderColor={borderColor} bg="gray.50">
          <Button size="sm" colorScheme="blue" leftIcon={<FiMail />}>
            New
          </Button>
          <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" />
          <IconButton aria-label="Archive" icon={<FiArchive />} size="sm" variant="ghost" />
          <Divider orientation="vertical" h="20px" />
          <IconButton aria-label="Reply" icon={<FiSend />} size="sm" variant="ghost" />
          <IconButton aria-label="Filter" icon={<FiFilter />} size="sm" variant="ghost" />
        </HStack>

        {/* Email List */}
        <VStack spacing={0} align="stretch" overflowY="auto" maxH="450px">
          {sampleEmails.map((email) => (
            <Box
              key={email.id}
              px={3}
              py={2}
              cursor="pointer"
              borderBottom="1px"
              borderColor={borderColor}
              bg={selectedEmail.id === email.id ? selectedBg : 'transparent'}
              onClick={() => setSelectedEmail(email)}
              _hover={{ bg: selectedEmail.id === email.id ? selectedBg : 'gray.50' }}
            >
              <HStack justify="space-between" mb={1}>
                <Text
                  fontSize="13px"
                  fontWeight={email.unread ? '600' : '400'}
                  color={selectedEmail.id === email.id ? 'blue.600' : 'inherit'}
                >
                  {email.sender}
                </Text>
                <Text fontSize="11px" color="gray.500">
                  {email.time}
                </Text>
              </HStack>
              <Text
                fontSize="13px"
                fontWeight={email.unread ? '600' : '400'}
                noOfLines={1}
                mb={1}
              >
                {email.subject}
              </Text>
              <Text fontSize="12px" color="gray.600" noOfLines={2}>
                {email.preview}
              </Text>
              {email.hasAttachment && (
                <HStack mt={1}>
                  <Icon as={FiPaperclip} boxSize={3} color="gray.400" />
                  <Text fontSize="11px" color="gray.500">Has attachment</Text>
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Reading Pane */}
      <Box flex={1} p={4} overflowY="auto" bg={useColorModeValue('white', 'gray.800')}>
        <VStack align="stretch" spacing={4}>
          <Box>
            <HStack justify="space-between" mb={2}>
              <Heading size="md">{selectedEmail.subject}</Heading>
              <HStack>
                <IconButton
                  aria-label="Reply"
                  icon={<FiSend />}
                  size="sm"
                  variant="outline"
                />
                <IconButton
                  aria-label="Delete"
                  icon={<FiTrash2 />}
                  size="sm"
                  variant="outline"
                />
              </HStack>
            </HStack>
            <HStack spacing={3}>
              <Avatar size="sm" name={selectedEmail.sender} />
              <Box>
                <Text fontSize="14px" fontWeight="500">{selectedEmail.sender}</Text>
                <Text fontSize="12px" color="gray.600">{selectedEmail.senderEmail}</Text>
              </Box>
              <Flex flex={1} />
              <Text fontSize="12px" color="gray.500">
                {selectedEmail.date} at {selectedEmail.time}
              </Text>
            </HStack>
          </Box>
          <Divider />
          <Text fontSize="14px" lineHeight="1.6">
            {selectedEmail.preview}
          </Text>
          {selectedEmail.hasAttachment && (
            <Box>
              <Text fontSize="12px" fontWeight="600" mb={2}>Attachments</Text>
              <HStack
                p={2}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
              >
                <Icon as={FiFile} color="gray.500" />
                <Text fontSize="13px">Document.pdf</Text>
                <Text fontSize="11px" color="gray.500">(245 KB)</Text>
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

// Apple Mail Style Component
const AppleMailStyle = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} p={3} borderRadius="lg">
      {/* Apple Mail Toolbar */}
      <HStack mb={3} spacing={2}>
        <Button size="sm" variant="ghost" leftIcon={<FiInbox />}>
          Inbox
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<FiStar />}>
          Starred
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<FiSend />}>
          Sent
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<FiFile />}>
          Drafts
        </Button>
        <Flex flex={1} />
        <IconButton
          aria-label="Search"
          icon={<FiSearch />}
          size="sm"
          variant="ghost"
        />
        <IconButton
          aria-label="Refresh"
          icon={<FiRefreshCw />}
          size="sm"
          variant="ghost"
        />
      </HStack>

      {/* Email Cards */}
      <VStack spacing={2} align="stretch">
        {sampleEmails.map((email) => (
          <Box
            key={email.id}
            bg={cardBg}
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'md',
            }}
          >
            <HStack justify="space-between" mb={2}>
              <HStack spacing={3}>
                <Avatar size="sm" name={email.sender} />
                <Box>
                  <HStack spacing={2}>
                    <Text fontSize="14px" fontWeight="500">
                      {email.sender}
                    </Text>
                    {email.unread && (
                      <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                    )}
                  </HStack>
                  <Text fontSize="12px" color="gray.500">
                    {email.senderEmail}
                  </Text>
                </Box>
              </HStack>
              <VStack align="flex-end" spacing={0}>
                <Text fontSize="12px" color="gray.500">
                  {email.date}
                </Text>
                <Text fontSize="11px" color="gray.400">
                  {email.time}
                </Text>
              </VStack>
            </HStack>
            <Text fontSize="14px" fontWeight="500" mb={1}>
              {email.subject}
            </Text>
            <Text fontSize="13px" color="gray.600" noOfLines={2}>
              {email.preview}
            </Text>
            <HStack mt={3} spacing={3}>
              {email.hasAttachment && (
                <HStack spacing={1}>
                  <Icon as={FiPaperclip} boxSize={3} color="gray.400" />
                  <Text fontSize="11px" color="gray.500">Attachment</Text>
                </HStack>
              )}
              {email.starred && (
                <HStack spacing={1}>
                  <Icon as={FiStar} boxSize={3} color="yellow.500" />
                  <Text fontSize="11px" color="gray.500">Starred</Text>
                </HStack>
              )}
              <Badge size="sm" colorScheme="gray">
                {email.category}
              </Badge>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

// Main Showcase Component
const EmailShowcase = () => {
  const [selectedStyle, setSelectedStyle] = useState<'gmail' | 'outlook' | 'apple'>('gmail');

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Email Display Styles</Heading>
          <Text color="gray.600">
            Choose the email display style that best fits your workflow
          </Text>
        </Box>

        {/* Style Selector */}
        <HStack spacing={4}>
          <Button
            onClick={() => setSelectedStyle('gmail')}
            variant={selectedStyle === 'gmail' ? 'solid' : 'outline'}
            colorScheme={selectedStyle === 'gmail' ? 'black' : 'gray'}
          >
            Gmail Style
          </Button>
          <Button
            onClick={() => setSelectedStyle('outlook')}
            variant={selectedStyle === 'outlook' ? 'solid' : 'outline'}
            colorScheme={selectedStyle === 'outlook' ? 'black' : 'gray'}
          >
            Office 365 / Outlook
          </Button>
          <Button
            onClick={() => setSelectedStyle('apple')}
            variant={selectedStyle === 'apple' ? 'solid' : 'outline'}
            colorScheme={selectedStyle === 'apple' ? 'black' : 'gray'}
          >
            Apple Mail Style
          </Button>
        </HStack>

        {/* Display Selected Style */}
        <Box>
          {selectedStyle === 'gmail' && (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" mb={2}>Gmail Style</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Clean list view with inline actions, checkboxes for bulk operations, and compact information display.
                  Best for power users who manage high email volumes.
                </Text>
              </Box>
              <GmailStyle />
            </VStack>
          )}

          {selectedStyle === 'outlook' && (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" mb={2}>Office 365 / Outlook Style</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Three-pane layout with email list and reading pane. Familiar for Office users with integrated preview.
                  Best for detailed email reading and quick navigation.
                </Text>
              </Box>
              <OutlookStyle />
            </VStack>
          )}

          {selectedStyle === 'apple' && (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" mb={2}>Apple Mail Style</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Card-based design with avatar images and rich preview. Clean and modern with subtle animations.
                  Best for visual users who prefer a beautiful, spacious interface.
                </Text>
              </Box>
              <AppleMailStyle />
            </VStack>
          )}
        </Box>

        {/* Feature Comparison */}
        <Box bg="gray.50" p={6} borderRadius="lg">
          <Heading size="sm" mb={4}>Style Comparison</Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <GridItem>
              <VStack align="start" spacing={2}>
                <Text fontWeight="600" fontSize="14px">Gmail Style</Text>
                <Text fontSize="13px">✓ Bulk selection</Text>
                <Text fontSize="13px">✓ Inline actions</Text>
                <Text fontSize="13px">✓ Compact view</Text>
                <Text fontSize="13px">✓ Quick starring</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={2}>
                <Text fontWeight="600" fontSize="14px">Outlook Style</Text>
                <Text fontSize="13px">✓ Reading pane</Text>
                <Text fontSize="13px">✓ Three-pane layout</Text>
                <Text fontSize="13px">✓ Detailed preview</Text>
                <Text fontSize="13px">✓ Integrated actions</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={2}>
                <Text fontWeight="600" fontSize="14px">Apple Mail</Text>
                <Text fontSize="13px">✓ Card design</Text>
                <Text fontSize="13px">✓ Avatar display</Text>
                <Text fontSize="13px">✓ Rich preview</Text>
                <Text fontSize="13px">✓ Category badges</Text>
              </VStack>
            </GridItem>
          </Grid>
        </Box>
      </VStack>
    </Container>
  );
};

export default EmailShowcase;