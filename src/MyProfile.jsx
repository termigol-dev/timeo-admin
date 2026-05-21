// src/MyProfile.jsx
import './style.css';

import React, {
  useEffect,
  useState
} from 'react';

import {
  ArrowLeft,
  FileText,
} from 'lucide-react';

import {
  useNavigate
} from 'react-router-dom';

import { getPlanUsage, getEmployees, getCompany, getBranches } from './api';

import ProfileHeader from './components/profile/ProfileHeader';
import PlanCard from './components/profile/PlanCard';
import TeamUsageCard from './components/profile/TeamUsageCard';
import BranchUsageCard from './components/profile/BranchUsageCard';
import BillingCard from './components/profile/BillingCard';
import InvoicesCard from './components/profile/InvoicesCard';
import SubscriptionCard from './components/profile/SubscriptionCard';
import DangerZoneCard from './components/profile/DangerZoneCard';
import UpgradeModal from './components/profile/UpgradeModal';

export default function MyProfile() {

  const navigate = useNavigate();

  const [upgradeOpen, setUpgradeOpen] =
    useState(false);

  const [profileData, setProfileData] =
    useState(null);

  const [employees, setEmployees] =
    useState([]);

  const [company, setCompany] =
    useState(null);

  const [branches, setBranches] = useState([]);

  const rawUser =
    localStorage.getItem('user');

  const user =
    rawUser
      ? JSON.parse(rawUser)
      : null;

  const companyId =
    user?.companyId;

  useEffect(() => {

    async function loadProfile() {

      try {

        // 🔥 PLAN USAGE
        const usage =
          await getPlanUsage();
        console.log(
          '💳 BILLING RAW:',
          usage
        );
        console.log(
          '🧾 FULL USAGE:',
          JSON.stringify(usage, null, 2)
        );

        console.log(
          '🟢 PLAN USAGE:',
          usage
        );

        console.log(
          '🧾 BILLING:',
          profileData?.company
        );
        setProfileData(usage);

        // 🔥 COMPANY
        if (companyId) {

          const companyData =
            await getCompany(companyId);

          console.log(
            '🏢 COMPANY:',
            companyData
          );

          setCompany(companyData);

          // 🔥 BRANCHES
          const branchesData =
            await getBranches(companyData.id);
          console.log(
            '🌿 BRANCHES:',
            branchesData
          );
          setBranches(branchesData);

          // 🔥 EMPLOYEES
          const employeesData =
            await getEmployees(companyId);

          console.log(
            '👥 EMPLOYEES:',
            employeesData
          );

          setEmployees(employeesData);
        }

      } catch (error) {

        console.error(
          'Error cargando profile',
          error
        );
      }
    }

    loadProfile();

  }, [companyId]);

  // 🔥 MOCK TEMPORAL
  const mockData = {

    billingPeriod: 'MONTHLY',

    extraEmployees: 2,

    price: 61,

    renewalDate: '12 junio 2026',

    cardLast4: '4242',
  };
  return (

    <div
      style={{
        background:
          'linear-gradient(180deg, #f8fbfc 0%, #f1f5f9 100%)',

        minHeight: '100vh',

        padding: 32,
      }}
    >

      <div
        style={{
          maxWidth: 1100,

          margin: '0 auto',

          display: 'flex',

          flexDirection: 'column',

          gap: 24,
        }}
      >

        {/* BACK */}
        <div
          className="dashboard-grid"
          style={{
            flexDirection: 'row',
            gap: 0,
          }}
        >
          <button
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
        </div>

        {/* HEADER */}
        <ProfileHeader
          companyLogo={company?.logoUrl}

          companyName={
            company?.commercialName || 'Empresa'
          }

          plan={
            profileData?.plan || 'BASIC'
          }

          subscriptionStatus={
            company?.subscriptionStatus || 'TRIAL'
          }

          billingPeriod={
            profileData?.company?.billingPeriod
          }

          renewalDate={
            profileData?.company?.renewalDate
          }

          price={
            profileData?.company?.currentPrice
          }


        />

        {/* TEAM */}
        <div
          style={{
            background:
              'rgba(255,255,255,0.78)',

            backdropFilter: 'blur(12px)',

            borderRadius: 30,

            border:
              '1px solid rgba(255,255,255,0.7)',

            padding: 4,

            boxShadow:
              '0 8px 30px rgba(148,163,184,0.08)',
          }}
        >
          <TeamUsageCard

            companyId={company?.id}
            employees={employees}
            employeesUsed={
              profileData?.employees?.used || 0
            }
            employeesLimit={
              profileData?.employees?.limit || 0
            }
            extraEmployees={
              Math.max(
                (profileData?.employees?.used || 0) -
                (profileData?.employees?.limit || 0),
                0
              )
            }
          />
        </div>

        {/* BRANCHES */}
        <div
          style={{
            background:
              'rgba(255,255,255,0.78)',

            backdropFilter: 'blur(12px)',

            borderRadius: 30,

            border:
              '1px solid rgba(255,255,255,0.7)',

            padding: 4,

            boxShadow:
              '0 8px 30px rgba(148,163,184,0.08)',
          }}
        >
          <BranchUsageCard
            companyId={company?.id}
            branchesUsed={
              profileData?.branches?.used || 0
            }

            branchesLimit={
              profileData?.branches?.limit || 0
            }
            branches={branches}
          />
        </div>

        {/* BILLING */}
        <div
          style={{
            background:
              'rgba(255,255,255,0.78)',

            backdropFilter: 'blur(12px)',

            borderRadius: 30,

            border:
              '1px solid rgba(255,255,255,0.7)',

            padding: 4,

            boxShadow:
              '0 8px 30px rgba(148,163,184,0.08)',
          }}
        >
          <BillingCard
            cardLast4={mockData.cardLast4}

            price={mockData.price}

            billingPeriod={
              profileData?.company
                ?.billingPeriod ||
              mockData.billingPeriod
            }

            showManageButton={true}
          />
        </div>

        {/* DANGER */}
        <div
          style={{
            background:
              'rgba(255,255,255,0.78)',

            backdropFilter: 'blur(12px)',

            borderRadius: 30,

            border:
              '1px solid rgba(255,255,255,0.7)',

            padding: 4,

            boxShadow:
              '0 8px 30px rgba(239,68,68,0.06)',
          }}
        >
          <DangerZoneCard />
        </div>

      </div>

      <UpgradeModal
        open={upgradeOpen}

        onClose={() =>
          setUpgradeOpen(false)
        }

        title="Actualizar a BUSINESS"

        description="
Desbloquea más empleados, más sucursales
y funcionalidades avanzadas para tu empresa.
"

        confirmText="Continuar con Stripe"

        onConfirm={() => {
          console.log(
            'STRIPE CHECKOUT'
          );
        }}
      />

    </div>
  );
}