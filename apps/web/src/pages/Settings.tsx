import { api } from '../lib/api';

type User = {
  id: string;
  email: string;
  name: string;
  provider?: string;
};

type Props = {
  user: User;
  onLogout: () => void;
};

export function Settings({ user, onLogout }: Props) {
  const handleLogout = async () => {
    await api.auth.logout();
    onLogout();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-500">Name</span>
            <p className="text-lg text-gray-900">{user.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Email</span>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Sign-in method</span>
            <p className="text-lg text-gray-900 capitalize">{user.provider || 'Email'}</p>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg text-lg"
        >
          Sign Out
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>Gold Investment Dashboard</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
}
