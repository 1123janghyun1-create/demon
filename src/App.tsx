import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AppList } from './components/AppList';
import { Builders } from './components/Builders';
import { Leaderboard } from './components/Leaderboard';
import { SubmitApp } from './components/SubmitApp';
import { Community } from './components/Community';
import { About } from './components/About';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DirectMessageModal } from './components/DirectMessageModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { LoginModal } from './components/LoginModal';
import { LegalModals, LegalModalType } from './components/LegalModals';
import { Toast } from './components/Toast';

export const AppContent: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    selectedProduct,
    setSelectedProduct,
    activeDmBuilder,
    setActiveDmBuilder,
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginModalMessage,
    isProfileEditOpen,
    setIsProfileEditOpen,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  return (
    <div className="min-h-screen bg-surface text-fg flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 lg:pl-[248px] flex flex-col min-h-screen">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Dynamic Page Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {currentTab === 'test' && <AppList />}
          {currentTab === 'builders' && <Builders />}
          {currentTab === 'leaderboard' && <Leaderboard />}
          {currentTab === 'submit' && <SubmitApp />}
          {currentTab === 'community' && <Community />}
          {currentTab === 'about' && <About />}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-border py-6 px-4 sm:px-6 text-center text-xs text-fg-muted flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[840px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <img src="/demon-mascot.png" alt="demonst" className="w-4 h-4 object-contain" />
            <button
              onClick={() => setCurrentTab('about')}
              className="font-bold text-fg hover:text-accent transition-colors cursor-pointer"
            >
              demonst
            </button>
            <span>· Made for indie makers & builders</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentTab('about')}
              className="hover:text-accent transition-colors font-medium cursor-pointer"
            >
              demonst 소개
            </button>
            <button
              onClick={() => setLegalModal('terms')}
              className="hover:text-accent transition-colors font-medium cursor-pointer"
            >
              이용약관
            </button>
            <button
              onClick={() => setLegalModal('privacy')}
              className="hover:text-accent transition-colors font-medium cursor-pointer"
            >
              개인정보처리방침
            </button>
            <button
              onClick={() => setLegalModal('contact')}
              className="hover:text-accent transition-colors font-medium cursor-pointer"
            >
              문의하기
            </button>
          </div>
        </footer>
      </div>

      {/* Legal Modals (Terms / Privacy / Contact) */}
      <LegalModals
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* 1:1 Direct Message Modal */}
      {activeDmBuilder && (
        <DirectMessageModal
          builder={activeDmBuilder}
          onClose={() => setActiveDmBuilder(null)}
        />
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
      />

      {/* Google Login Gate Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        message={loginModalMessage}
      />

      {/* Floating Toast Notification */}
      <Toast />
    </div>
  );
};
