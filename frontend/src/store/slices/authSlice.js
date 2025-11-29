import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { travelerApi } from '../../services/api';

// Async thunk for login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await travelerApi.login(credentials);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            await travelerApi.logout();
            return null;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
        error: null,
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
            });
    },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
