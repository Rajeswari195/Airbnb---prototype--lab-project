// /frontend/src/features/bookings/bookingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { travelerApi } from '../../services/api';

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

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    statusFilter: 'All',
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    clearBookingsState(state) {
      state.statusFilter = 'All';
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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

export const { setStatusFilter, clearBookingsState } = bookingsSlice.actions;
export default bookingsSlice.reducer;
