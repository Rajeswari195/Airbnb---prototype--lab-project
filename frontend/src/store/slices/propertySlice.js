import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { travelerApi } from '../../services/api';

export const fetchProperties = createAsyncThunk(
    'properties/fetchProperties',
    async (filters, { rejectWithValue }) => {
        try {
            const data = await travelerApi.listings(filters);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const propertySlice = createSlice({
    name: 'properties',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProperties.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProperties.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchProperties.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default propertySlice.reducer;
