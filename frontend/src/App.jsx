import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import Loader from "./components/Loader";
import NoticeBanner from "./components/NoticeBanner";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import { AppProvider, useAppContext } from "./context/AppContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const BookingConfirmPage = lazy(() => import("./pages/BookingConfirmPage"));
const BookingDetailsPage = lazy(() => import("./pages/BookingDetailsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ServiceDetailsPage = lazy(() => import("./pages/ServiceDetailsPage"));
const ServiceFormPage = lazy(() => import("./pages/ServiceFormPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CustomerBookingsPage = lazy(() => import("./pages/customer/CustomerBookingsPage"));
const CustomerFavoritesPage = lazy(() => import("./pages/customer/CustomerFavoritesPage"));
const CustomerOverviewPage = lazy(() => import("./pages/customer/CustomerOverviewPage"));
const CustomerReviewsPage = lazy(() => import("./pages/customer/CustomerReviewsPage"));
const CustomerSettingsPage = lazy(() => import("./pages/customer/CustomerSettingsPage"));
const CustomerWalletPage = lazy(() => import("./pages/customer/CustomerWalletPage"));
const ProviderBookingsPage = lazy(() => import("./pages/provider/ProviderBookingsPage"));
const ProviderEarningsPage = lazy(() => import("./pages/provider/ProviderEarningsPage"));
const ProviderOverviewPage = lazy(() => import("./pages/provider/ProviderOverviewPage"));
const ProviderServicesPage = lazy(() => import("./pages/provider/ProviderServicesPage"));
const ProviderSettingsPage = lazy(() => import("./pages/provider/ProviderSettingsPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminServicesPage = lazy(() => import("./pages/admin/AdminServicesPage"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage"));
const AdminDisputesPage = lazy(() => import("./pages/admin/AdminDisputesPage"));

function getLegacyDestination(kind, currentUser) {
  if (!currentUser) {
    return "/login";
  }

  if (kind === "dashboard") {
    if (currentUser.role === "admin") {
      return "/admin";
    }

    return currentUser.role === "provider" ? "/provider" : "/customer";
  }

  if (kind === "bookings") {
    if (currentUser.role === "admin") {
      return "/admin/bookings";
    }

    return currentUser.role === "provider" ? "/provider/bookings" : "/customer/bookings";
  }

  if (currentUser.role === "provider") {
    return "/provider/settings";
  }

  if (currentUser.role === "admin") {
    return "/admin";
  }

  return "/customer/settings";
}

function LegacyWorkspaceRedirect({ kind }) {
  const location = useLocation();
  const { currentUser, sessionLoading } = useAppContext();

  if (sessionLoading) {
    return <Loader label="Opening workspace..." />;
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <Navigate to={getLegacyDestination(kind, currentUser)} replace />;
}

function LegacyBookingDetailsRedirect() {
  const { bookingId } = useParams();
  const location = useLocation();
  const { currentUser, sessionLoading } = useAppContext();

  if (sessionLoading) {
    return <Loader label="Opening booking..." />;
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const basePath =
    currentUser.role === "admin"
      ? "/admin/bookings"
      : currentUser.role === "provider"
        ? "/provider/bookings"
        : "/customer/bookings";

  return <Navigate to={`${basePath}/${bookingId}`} replace />;
}

function AppLayout() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/customer") ||
    location.pathname.startsWith("/provider") ||
    location.pathname.startsWith("/admin");

  return (
    <div className={isDashboardRoute ? "app-shell app-shell-dashboard" : "app-shell"}>
      <SiteHeader />
      <NoticeBanner />
      <main className="app-main">
        <Suspense fallback={<Loader label="Loading page..." />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<ServicesPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailsPage />} />
            <Route path="/booking-confirm/:bookingId" element={<BookingConfirmPage />} />
            <Route path="/bookings/:bookingId" element={<LegacyBookingDetailsRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route path="/dashboard" element={<LegacyWorkspaceRedirect kind="dashboard" />} />
            <Route path="/bookings" element={<LegacyWorkspaceRedirect kind="bookings" />} />
            <Route path="/profile" element={<LegacyWorkspaceRedirect kind="profile" />} />
            <Route path="/customer/dashboard" element={<CustomerOverviewPage />} />
            <Route path="/customer" element={<CustomerOverviewPage />} />
            <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
            <Route path="/customer/bookings/:bookingId" element={<BookingDetailsPage />} />
            <Route path="/customer/favorites" element={<CustomerFavoritesPage />} />
            <Route path="/customer/profile" element={<CustomerSettingsPage />} />
            <Route path="/customer/reviews" element={<CustomerReviewsPage />} />
            <Route path="/customer/wallet" element={<CustomerWalletPage />} />
            <Route path="/customer/settings" element={<CustomerSettingsPage />} />
            <Route path="/provider/dashboard" element={<ProviderOverviewPage />} />
            <Route path="/provider" element={<ProviderOverviewPage />} />
            <Route path="/provider/bookings" element={<ProviderBookingsPage />} />
            <Route path="/provider/bookings/:bookingId" element={<BookingDetailsPage />} />
            <Route path="/provider/earnings" element={<ProviderEarningsPage />} />
            <Route path="/provider/manage-services" element={<ProviderServicesPage />} />
            <Route path="/provider/services" element={<ProviderServicesPage />} />
            <Route path="/provider/profile" element={<ProviderSettingsPage />} />
            <Route path="/provider/settings" element={<ProviderSettingsPage />} />
            <Route path="/provider/services/new" element={<ServiceFormPage />} />
            <Route path="/provider/services/:id/edit" element={<ServiceFormPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/bookings/:bookingId" element={<BookingDetailsPage />} />
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
