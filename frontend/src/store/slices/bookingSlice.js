import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { travelerApi } from '../../services/api';

export const createBooking = createAsyncThunk(
    'bookings/createBooking',
    async (bookingData, { rejectWithValue }) => {
        try {
            const response = await fetch('http://localhost:8003/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Booking failed');
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchBookings = createAsyncThunk(
    'bookings/fetchBookings',
    async (statusFilter, { rejectWithValue }) => {
        try {
            const params = {};
            if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
            const rows = await travelerApi.listBookings(params);
            return Array.isArray(rows) ? rows : [];
        } catch (e) {
            return rejectWithValue(e.message || 'Failed to load bookings');
        }
    }
);

const bookingSlice = createSlice({
    name: 'bookings',
    initialState: {
        currentBooking: null,
        items: [],
        statusFilter: 'All',
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        resetBookingState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.currentBooking = null;
        },
        setStatusFilter(state, action) {
            state.statusFilter = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Booking
            .addCase(createBooking.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentBooking = action.payload;
            })
            .addCase(createBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Fetch Bookings
            .addCase(fetchBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetBookingState, setStatusFilter } = bookingSlice.actions;
export default bookingSlice.reducer;
