import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProperties = createAsyncThunk(
    'properties/fetchProperties',
    async (filters, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`http://localhost:8000/api/properties?${query}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch properties');
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
