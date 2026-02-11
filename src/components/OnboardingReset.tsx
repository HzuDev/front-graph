import React from "react";
import { buildPath } from "../lib/utils/paths";

const OnboardingReset: React.FC = () => {
  const handleReset = () => {
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("user_location");
    localStorage.removeItem("detected_municipality");
    window.location.href = import.meta.env.BASE_URL + "/onboarding/1";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Reiniciar Onboarding
        </h1>
        <p className="text-gray-600 mb-6">
          Esto borrará tu ubicación guardada y te permitirá volver a hacer el
          onboarding.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Reiniciar Onboarding
          </button>

          <a
            href={buildPath("/")}
            className="block w-full text-center bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            Volver al inicio
          </a>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-sm text-gray-700 mb-2">
            Estado Actual:
          </h3>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>
              Onboarding completado:{" "}
              {localStorage.getItem("onboarding_completed") ? "✅ Sí" : "❌ No"}
            </li>
            <li>
              Ubicación guardada:{" "}
              {localStorage.getItem("user_location") ? "✅ Sí" : "❌ No"}
            </li>
            <li>
              Municipio detectado:{" "}
              {localStorage.getItem("detected_municipality")
                ? "✅ Sí"
                : "❌ No"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OnboardingReset;
