import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Users, MessageSquare, Settings, LogOut, ShoppingCart, FileText, Truck, Gift, HelpCircle, ShieldCheck, BarChart3, Mail, Smartphone, Ticket, Bell, Database, UserPlus, Shield, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminSidebar = ({ onLogout, onLinkClick }) => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Products", icon: ShoppingBag, path: "/admin/products" },
    { name: "Orders", icon: ShoppingCart, path: "/admin/orders" },
    { name: "Customers", icon: Users, path: "/admin/customers" },
    { name: "Consultations", icon: FileText, path: "/admin/consultations" },
    { name: "Sales & Reports", icon: BarChart3, path: "/admin/sales" },
    { name: "Coupons", icon: Ticket, path: "/admin/coupons" }, 
    {
      name: "Gift Vouchers",
      icon: Gift,
      subItems: [
        { name: "Voucher Types", path: "/admin/gift-voucher-types" },
        { name: "Issued Vouchers", path: "/admin/issued-gift-vouchers" },
      ],
    },
    { name: "Product FAQs", icon: HelpCircle, path: "/admin/product-faqs" },
    { name: "Knowledge Base", icon: Database, path: "/admin/knowledge-base" },
    {
      name: "Chat Management",
      icon: MessageSquare,
      subItems: [
        { name: "Chat Leads", path: "/admin/chat-leads", icon: Users },
        { name: "Chat Monitoring", path: "/admin/chat-monitoring", icon: Shield },
      ],
    },
    {
      name: "Communication",
      icon: MessageSquare,
      subItems: [
        { name: "Messages", path: "/admin/messages", icon: MessageSquare },
        { name: "Newsletter", path: "/admin/newsletter", icon: Mail },
        { name: "Email Settings", path: "/admin/communication/email", icon: Mail },
        { name: "SMS Settings", path: "/admin/communication/sms", icon: Smartphone },
        { name: "Notifications", path: "/admin/communication/notifications", icon: Bell },
      ],
    },
    { name: "Shipping Rules", icon: Truck, path: "/admin/shipping" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <div className="h-full w-64 bg-slate-800 text-slate-100 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">
          TailoredHands
        </h1>
        <p className="text-xs text-slate-400 text-center mt-1">Admin Panel</p>
      </div>

      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) =>
          item.subItems ? (
            <div key={item.name} className="space-y-1">
              <span className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {item.name}
              </span>
              {item.subItems.map((subItem) => (
                <NavLink
                  key={subItem.name}
                  to={subItem.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out transform hover:bg-slate-700 hover:shadow-md hover:scale-105 ${
                      isActive ? "bg-gradient-to-r from-[#D2B48C] to-[#B8860B] shadow-lg scale-105 text-white" : "text-slate-300 hover:text-white"
                    }`
                  }
                >
                  {subItem.icon && <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />}
                  <span className="text-sm font-medium">{subItem.name}</span>
                </NavLink>
              ))}
            </div>
          ) : (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out transform hover:bg-slate-700 hover:shadow-md hover:scale-105 ${
                  isActive ? "bg-gradient-to-r from-[#D2B48C] to-[#B8860B] shadow-lg scale-105 text-white" : "text-slate-300 hover:text-white"
                }`
              }
            >
              {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-700">
        {user && (
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-slate-200">{user.email}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors duration-200 py-2.5"
        >
          <LogOut className="mr-2 h-5 w-5" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
