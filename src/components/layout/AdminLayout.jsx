"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckSquare, ClipboardList, Home, LogOut, Menu, Database, ChevronDown, ChevronRight, Zap, FileText, X, Play, Pause, KeyRound, Video } from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }

    setUsername(storedUsername)
    setUserRole(storedRole || "user")
  }, [navigate])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    navigate("/login")
  }

  // Filter dataCategories based on user role
  const dataCategories = [
    //{ id: "main", name: "PURAB", link: "/dashboard/data/main" },
    { id: "sales", name: "Checklist", link: "/dashboard/data/sales" },
    // { id: "service", name: "Service", link: "/dashboard/data/service" },
    //{ id: "account", name: "RKL", link: "/dashboard/data/account" },
    //{ id: "warehouse", name: "REFRASYNTH", link: "/dashboard/data/warehouse" },
    //{ id: "delegation", name: "Delegation", link: "/dashboard/data/delegation" },
    //{ id: "purchase", name: "Slag Crusher", link: "/dashboard/data/purchase" },
    //{ id: "director", name: "Hr", link: "/dashboard/data/director" },
    //{ id: "managing-director", name: "PURAB", link: "/dashboard/data/managing-director" },
    // { id: "coo", name: "COO", link: "/dashboard/data/coo" },
    // { id: "jockey", name: "Jockey", link: "/dashboard/data/jockey" },
  ]

  // Update the routes array based on user role
  const routes = [
    // {
    //   href: "/dashboard/admin",
    //   label: "Dashboard",
    //   icon: Database,
    //   active: location.pathname === "/dashboard/admin",
    //   showFor: ["admin", "user"] // Show for both roles
    // },
    // {
    //   href: "/dashboard/quick-task",
    //   label: "Quick Task",
    //   icon: Zap,
    //   active: location.pathname === "/dashboard/quick-task",
    //   showFor: ["admin", "user"] // Only show for admin
    // },
    // {
    //   href: "/dashboard/assign-task",
    //   label: "Assign Task",
    //   icon: CheckSquare,
    //   active: location.pathname === "/dashboard/assign-task",
    //   showFor: ["admin"] // Only show for admin
    // },

    // {
    //   href: "/dashboard/delegation",
    //   label: "Delegation",
    //   icon: ClipboardList,
    //   active: location.pathname === "/dashboard/delegation",
    //   showFor: ["admin", "user"] // Only show for admin
    // },
    // {
    //   href: "#",
    //   label: "Data",
    //   icon: Database,
    //   active: location.pathname.includes("/dashboard/data"),
    //   submenu: true,
    //   showFor: ["admin", "user"] // Show for both roles
    // },

    // {
    //   href: "/dashboard/license",
    //   label: "License",
    //   icon: KeyRound,
    //   active: location.pathname === "/dashboard/license",
    //   showFor: ["admin", "user"] // show both
    // },

    // {
    //   href: "/dashboard/traning-video",
    //   label: "Training Video",
    //   icon: Video,
    //   active: location.pathname === "/dashboard/traning-video",
    //   showFor: ["admin", "user"] //  show both
    // },
  ]

  const getAccessibleDepartments = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return dataCategories.filter(cat =>
      !cat.showFor || cat.showFor.includes(userRole)
    )
  }

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return routes.filter(route =>
      route.showFor.includes(userRole)
    )
  }

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/")

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true)
    }
  }, [isDataPage, isDataSubmenuOpen])

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes()
  const accessibleDepartments = getAccessibleDepartments()

  // License Modal Component
  const LicenseModal = () => {
    // Function to convert YouTube URL to embed URL
    const getYouTubeEmbedUrl = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
        : url;
    };


  }

  return (
    <div className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}>




      {/* License Modal */}
      {isLicenseModalOpen && <LicenseModal />}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-blue-200 bg-white px-4 md:px-6">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-semibold text-blue-700">Visitor's Request Form</h1>
          {/*<button
            onClick={() => setIsLicenseModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            title="License & Help"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">License</span>
          </button>
          */}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
          <div className="fixed bottom-0 left-0 right-0 bg-orange-50/90 backdrop-blur-sm border-t border-orange-200 py-1 z-10">
            <div className="text-center">
              <a
                href="https://www.botivate.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-orange-700 text-xs"
              >
                Powered by <span className="font-medium">Botivate</span>
              </a>
            </div>
          </div>
        </main>
      </div>

    </div>
  )
}