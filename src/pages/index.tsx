import Head from 'next/head';
import useSWR from 'swr';
import { mutate } from 'swr';
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { AddRounded } from '@mui/icons-material';

// Define types for Customer, a list of Customers, and API error responses.
export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
};

export type Customers = Customer[];

export type ApiError = {
  code: string;
  message: string;
};

const Home = () => {
  // State to control the open/close state of the Add Customer dialog.
  const [open, setOpen] = useState(false);
  // State to store form input values.
  const [formData, setFormData] = useState<Customer>({
    firstName: '',
    lastName: '',
    email: '',
    businessName: ''
  });
  // State to track validation errors for required fields.
  const [formErrors, setFormErrors] = useState({
    firstName: false,
    lastName: false,
    email: false
  });

  // Fetcher function for useSWR to get customers from the API.
  const fetcher = async (url: string) => {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) throw body;
    return body;
  };

  // SWR hook to fetch customers; provides data, error, and loading state.
  const { data, error, isLoading } = useSWR<Customers, ApiError>(
    '/api/customers',
    fetcher
  );

  // Open the Add Customer dialog.
  const handleOpen = () => {
    setOpen(true);
  };

  // Close the dialog and reset form data and validation errors.
  const handleClose = () => {
    setOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      businessName: ''
    });
    setFormErrors({
      firstName: false,
      lastName: false,
      email: false
    });
  };

  // Update form data and clear validation error for a field if it has a non-empty value.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (value.trim() !== '') {
      setFormErrors({
        ...formErrors,
        [name]: false
      });
    }
  };

  // Validate and submit the new customer form.
  const handleSubmit = async () => {
    // Check required fields for empty values.
    const newErrors = {
      firstName: formData.firstName.trim() === '',
      lastName: formData.lastName.trim() === '',
      email: formData.email.trim() === ''
    };

    setFormErrors(newErrors);

    // If any required field is empty, do not proceed.
    if (newErrors.firstName || newErrors.lastName || newErrors.email) {
      return;
    }

    try {
      // Make a POST request to add a new customer.
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      // Handle unsuccessful responses.
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add customer');
      }

      // Refresh the customer list after adding a new customer.
      mutate('/api/customers');
      // Close the dialog after successful submission.
      handleClose();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  // Helper function to display either the business name or the full name of a customer.
  const getDisplayName = (customer: Customer) => {
    if (customer.businessName && customer.businessName.trim() !== '') {
      return customer.businessName;
    }
    return `${customer.firstName} ${customer.lastName}`;
  };

  return (
    <>
      <Head>
        <title>Dwolla | Customers</title>
      </Head>
      <main>
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
          {/* Header section with customer count and Add Customer button */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant="h6" component="h1">
              {data ? `${data.length} Customers` : 'Customers'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddRounded />}
              onClick={handleOpen}
              sx={{ 
                bgcolor: '#1a202c', 
                '&:hover': { bgcolor: '#2d3748' },
                textTransform: 'none',
                borderRadius: 1
              }}
            >
              Add Customer
            </Button>
          </Box>

          {/* Loading and error states */}
          {isLoading && <Box sx={{ p: 2 }}>Loading...</Box>}
          {error && <Box sx={{ p: 2, color: 'error.main' }}>Error: {error.message}</Box>}
          
          {/* Table displaying the list of customers */}
          {data && (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ borderBottom: '1px solid #e2e8f0' }}>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((customer) => (
                    <TableRow 
                      key={customer.email}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>{getDisplayName(customer)}</TableCell>
                      <TableCell sx={{ py: 2 }}>{customer.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Dialog for adding a new customer */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
              Add Customer
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <TextField
                  required
                  error={formErrors.firstName}
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  sx={{ flex: '1 1 calc(33.33% - 16px)' }}
                  helperText={formErrors.firstName ? 'Required field' : ''}
                />
                <TextField
                  required
                  error={formErrors.lastName}
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  sx={{ flex: '1 1 calc(33.33% - 16px)' }}
                  helperText={formErrors.lastName ? 'Required field' : ''}
                />
                <TextField
                  name="businessName"
                  label="Business Name"
                  value={formData.businessName}
                  onChange={handleChange}
                  sx={{ flex: '1 1 calc(33.33% - 16px)' }}
                />
              </Box>
              <TextField
                required
                error={formErrors.email}
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                helperText={formErrors.email ? 'Required field' : ''}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleClose}
                sx={{ 
                  color: 'text.primary',
                  textTransform: 'none',
                  mr: 1
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                variant="contained"
                sx={{ 
                  bgcolor: '#1a202c', 
                  '&:hover': { bgcolor: '#2d3748' },
                  textTransform: 'none',
                  borderRadius: 1
                }}
              >
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </main>
    </>
  );
};

export default Home;