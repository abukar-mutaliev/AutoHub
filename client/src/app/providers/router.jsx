import { createBrowserRouter } from "react-router-dom";
import { App } from "../App";
import { HomePage } from "../../pages/home/ui/HomePage";
import { LoginPage } from "../../pages/auth/ui/LoginPage";
import { RegisterPage } from "../../pages/auth/ui/RegisterPage";
import { routes } from "../../shared/config/routes";
import { ServicesPage } from "../../pages/services/ui/ServicesPage";
import { OrdersPage } from "../../pages/orders/ui/OrdersPage";
import { OwnerPage } from "../../pages/owner/ui/OwnerPage";
import { MasterPage } from "../../pages/master/ui/MasterPage";
import { ProfilePage } from "../../pages/profile/ui/ProfilePage";
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from "./guards";

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: routes.login,
        element: (
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        )
      },
      {
        path: routes.register,
        element: (
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        )
      },
      { path: routes.services, element: <ServicesPage /> },
      {
        path: routes.orders,
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        )
      },
      {
        path: routes.profile,
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        )
      },
      {
        path: routes.ownerPanel,
        element: (
          <RequireAuth>
            <RequireRole roles={["OWNER"]}>
              <OwnerPage />
            </RequireRole>
          </RequireAuth>
        )
      },
      {
        path: routes.masterPanel,
        element: (
          <RequireAuth>
            <RequireRole roles={["MASTER"]}>
              <MasterPage />
            </RequireRole>
          </RequireAuth>
        )
      }
    ]
  }
]);
