import React, { useState, useEffect } from 'react';

// Komponen untuk menampilkan kartu kandidat (digunakan di daftar pilihan, bukan di daftar perbandingan utama)
const CandidateCard = ({ candidate, onRemove, showDetails }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center justify-between transition-transform transform hover:scale-105 duration-300 relative">
      {onRemove && (
        <button
          onClick={() => onRemove(candidate.id)}
          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200"
          aria-label="Hapus kandidat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      )}
      <img
        src={candidate.image}
        alt={candidate.name}
        className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-yellow-500"
        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/96x96/4A5568/FFFFFF?text=No+Image"; }}
      />
      <h3 className="text-white text-lg font-semibold text-center mb-2">{candidate.name}</h3>
      <p className="text-gray-300 text-sm text-center">{candidate.nip}</p>
      <p className="text-gray-400 text-xs text-center">{candidate.position}</p>
      <p className="text-gray-400 text-xs text-center mb-4">{candidate.organization}</p>
      {showDetails && (
        <button
          onClick={() => showDetails(candidate)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Lihat Detail
        </button>
      )}
    </div>
  );
};

// Komponen Modal untuk menampilkan detail portofolio
const PortfolioDetailModal = ({ title, items, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl font-bold"
          >
            &times;
          </button>
        </div>
        <ul className="list-disc list-inside text-gray-300">
          {items.length > 0 ? (
            items.map((item, index) => (
              <li key={index} className="mb-2">{item}</li>
            ))
          ) : (
            <li>Tidak ada informasi yang tersedia.</li>
          )}
        </ul>
        <div className="flex justify-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper untuk membuat Radar Chart SVG
const RadarChart = ({ data, maxValues }) => {
  const size = 200;
  const radius = size / 2 - 20; // Adjusted for padding
  const centerX = size / 2;
  const centerY = size / 2;

  const features = Object.keys(data);
  const angleSlice = (Math.PI * 2) / features.length;

  // Calculate points for the polygon
  const getPathCoordinates = (d) => {
    return features.map((feature, i) => {
      const value = d[feature] || 0;
      const normalizedValue = maxValues[feature] > 0 ? value / maxValues[feature] : 0; // Normalize value, avoid division by zero
      const x = centerX + normalizedValue * radius * Math.cos(angleSlice * i - Math.PI / 2);
      const y = centerY + normalizedValue * radius * Math.sin(angleSlice * i - Math.PI / 2);
      return `${x},${y}`;
    }).join(" ");
  };

  // Generate axes
  const getAxisLines = () => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
      <circle
        key={`grid-circle-${i}`}
        cx={centerX}
        cy={centerY}
        r={radius * scale}
        fill="none"
        stroke="#555"
        strokeWidth="0.5"
      />
    )).concat(
      features.map((_, i) => {
        const x = centerX + radius * Math.cos(angleSlice * i - Math.PI / 2);
        const y = centerY + radius * Math.sin(angleSlice * i - Math.PI / 2);
        return (
          <line
            key={`axis-${i}`}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="#555"
            strokeWidth="1"
          />
        );
      })
    );
  };

  // Generate labels
  const getAxisLabels = () => {
    return features.map((feature, i) => {
      const x = centerX + (radius + 15) * Math.cos(angleSlice * i - Math.PI / 2);
      const y = centerY + (radius + 15) * Math.sin(angleSlice * i - Math.PI / 2);
      return (
        <text
          key={`label-${i}`}
          x={x}
          y={y}
          fill="#ccc"
          fontSize="10"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {feature.replace(/([A-Z])/g, ' $1').trim()} {/* Add space before capital letters */}
        </text>
      );
    });
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getAxisLines()} {/* Render grid lines and circles */}
      <polygon
        points={getPathCoordinates(data)}
        fill="rgba(0, 255, 0, 0.6)" // Green fill
        stroke="green"
        strokeWidth="2"
      />
      {getAxisLabels()}
    </svg>
  );
};


// Komponen untuk menampilkan duel statistik
const DuelStatsModal = ({ candidates, onClose, onRemoveCandidate }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalContent, setDetailModalContent] = useState({ title: '', items: [] });
  const [activeCandidateId, setActiveCandidateId] = useState(candidates[0]?.id);
  const [showFloatingList, setShowFloatingList] = useState(false);
  const [selectedPortfolioDetail, setSelectedPortfolioDetail] = useState(null); // New state for inline portfolio details

  const activeCandidate = candidates.find(c => c.id === activeCandidateId);

  // Calculate max values for radar chart normalization
  const maxStats = {
    totalExperience: 0,
    educationTraining: 0,
    seminarsCertifications: 0,
    jobHistory: 0,
    performanceAchievements: 0,
  };

  candidates.forEach(cand => {
    for (const key in maxStats) {
      if (cand.stats[key] > maxStats[key]) {
        maxStats[key] = cand.stats[key];
      }
    }
  });

  const handleShowDetails = (title, items) => {
    setDetailModalContent({ title, items });
    setShowDetailModal(true);
  };

  const handlePortfolioPointClick = (title, items) => {
    setSelectedPortfolioDetail({ title, items });
  };

  // Logic to determine why a candidate is better (simplified)
  const getComparisonAdvantages = (currentCandidate) => {
    const advantages = [];
    const statLabels = {
      totalExperience: "Pengalaman Total",
      educationTraining: "Pendidikan & Pelatihan",
      seminarsCertifications: "Seminar & Sertifikasi",
      jobHistory: "Riwayat Jabatan",
      performanceAchievements: "Pencapaian Kinerja",
    };

    for (const statKey in currentCandidate.stats) {
      let isBetter = true;
      let highestValue = currentCandidate.stats[statKey];

      // Check if current candidate has the highest value for this stat among all compared candidates
      for (const otherCandidate of candidates) {
        if (otherCandidate.id !== currentCandidate.id && otherCandidate.stats[statKey] >= highestValue) {
          isBetter = false;
          break;
        }
      }

      if (isBetter && highestValue > 0) {
        advantages.push({
          label: statLabels[statKey],
          value: highestValue,
          details: currentCandidate.portfolio[`${statKey}Details`]
        });
      }
    }

    // Add specific knowledge/skills if they are unique or highly relevant
    if (currentCandidate.knowledge.skillSet && currentCandidate.knowledge.skillSet.length > 0) {
        advantages.push({
            label: "Keahlian Unik",
            value: currentCandidate.knowledge.skillSet.join(', '),
            details: [`Keahlian: ${currentCandidate.knowledge.skillSet.join(', ')}`]
        });
    }
    if (currentCandidate.knowledge.certifications && currentCandidate.knowledge.certifications.length > 0) {
        advantages.push({
            label: "Sertifikasi Penting",
            value: currentCandidate.knowledge.certifications.join(', '),
            details: [`Sertifikasi: ${currentCandidate.knowledge.certifications.join(', ')}`]
        });
    }

    return advantages;
  };

  const activeCandidateAdvantages = activeCandidate ? getComparisonAdvantages(activeCandidate) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-7xl overflow-y-auto max-h-[90vh] relative"> {/* Added relative for floating button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Duel Statistik Karakter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Candidate Tabs/Headers */}
        <div className="flex justify-around border-b border-gray-700 mb-6">
          {candidates.map((cand) => (
            <button
              key={cand.id}
              onClick={() => setActiveCandidateId(cand.id)}
              className={`px-4 py-2 text-lg font-semibold transition-colors duration-200 ${
                activeCandidateId === cand.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cand.name.split(',')[0]} {/* Show only name before comma */}
            </button>
          ))}
        </div>

        {activeCandidate && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section: Radar Chart, Portfolio Points, and Inventaris Pengetahuan */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center">
              {/* Statistik Kekuatan - Radar Chart */}
              <h4 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v2.102a1 1 0 01-.817.986l-3.23.538A2 2 0 006 7v1a2 2 0 002 2h2a2 2 0 002-2v-.102a1 1 0 01.817-.986l3.23-.538A2 2 0 0118 13v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-.102a1 1 0 01-.817-.986l-3.23-.538A2 2 0 002 9V8a2 2 0 012-2h2a2 2 0 012 2v.102a1 1 0 01.817.986l3.23.538A2 2 0 0114 7v-1a2 2 0 00-2-2h-2a2 2 0 00-2 2V6a1 1 0 01-.817-.986l-3.23-.538A2 2 0 002 3V2a1 1 0 011.3-1.046zM14 17a1 1 0 100 2h2a1 1 0 100-2h-2zM4 17a1 1 0 100 2h2a1 1 0 100-2H4z" clipRule="evenodd"></path></svg>
                Statistik Kekuatan
              </h4>
              <div className="flex flex-col md:flex-row items-center justify-center w-full">
                <RadarChart data={activeCandidate.stats} maxValues={maxStats} />
                {selectedPortfolioDetail && (
                  <div className="bg-gray-700 p-4 rounded-lg mt-4 md:mt-0 md:ml-6 w-full md:w-1/2">
                    <h5 className="text-white text-md font-semibold mb-2">{selectedPortfolioDetail.title}</h5>
                    <ul className="list-disc list-inside text-gray-300 text-sm">
                      {selectedPortfolioDetail.items.length > 0 ? (
                        selectedPortfolioDetail.items.map((item, index) => (
                          <li key={index} className="mb-1">{item}</li>
                        ))
                      ) : (
                        <li>Tidak ada detail yang tersedia.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>


              {/* Portfolio Points Section */}
              <div className="w-full mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-blue-400 text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 10H4V6h12v8z" clipRule="evenodd"></path></svg>
                  Poin Portofolio
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => handlePortfolioPointClick("Level Pengalaman Total", activeCandidate.portfolio.totalExperienceDetails)}
                    className="bg-gray-700 p-3 rounded-lg text-white text-center hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  >
                    <p className="text-sm">Pengalaman</p>
                    <p className="font-bold text-xl">{activeCandidate.stats.totalExperience}</p>
                  </button>
                  <button
                    onClick={() => handlePortfolioPointClick("Pendidikan & Pelatihan", activeCandidate.portfolio.educationTrainingDetails)}
                    className="bg-gray-700 p-3 rounded-lg text-white text-center hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  >
                    <p className="text-sm">Pendidikan</p>
                    <p className="font-bold text-xl">{activeCandidate.stats.educationTraining}</p>
                  </button>
                  <button
                    onClick={() => handlePortfolioPointClick("Seminar & Sertifikasi", activeCandidate.portfolio.seminarsCertificationsDetails)}
                    className="bg-gray-700 p-3 rounded-lg text-white text-center hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  >
                    <p className="text-sm">Sertifikasi</p>
                    <p className="font-bold text-xl">{activeCandidate.stats.seminarsCertifications}</p>
                  </button>
                  <button
                    onClick={() => handlePortfolioPointClick("Riwayat Jabatan", activeCandidate.portfolio.jobHistoryDetails)}
                    className="bg-gray-700 p-3 rounded-lg text-white text-center hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  >
                    <p className="text-sm">Riwayat</p>
                    <p className="font-bold text-xl">{activeCandidate.stats.jobHistory}</p>
                  </button>
                  <button
                    onClick={() => handlePortfolioPointClick("Pencapaian Kinerja", activeCandidate.portfolio.performanceAchievementsDetails)}
                    className="bg-gray-700 p-3 rounded-lg text-white text-center hover:bg-gray-600 transition-colors duration-200 cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <p className="text-sm">Pencapaian</p>
                    <p className="font-bold text-xl">{activeCandidate.stats.performanceAchievements}</p>
                  </button>
                </div>
              </div>

              {/* Inventaris Pengetahuan */}
              <div className="w-full mt-6">
                <h4 className="text-purple-400 text-lg font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 00-2 0v2a1 1 0 102 0V9zm4 0a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"></path></svg>
                  Inventaris Pengetahuan
                </h4>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">
                    <span className="font-semibold text-white">Skill Set (Keahlian):</span>
                    <br />
                    {activeCandidate.knowledge.skillSet.length > 0 ? (
                      activeCandidate.knowledge.skillSet.map((skill, index) => (
                        <span key={index} className="inline-block bg-gray-600 text-white text-xs px-2 py-1 rounded-full mr-2 mb-1">{skill}</span>
                      ))
                    ) : (
                      "Pegawai ini belum memiliki skill khusus. Saatnya belajar hal baru!"
                    )}
                  </p>
                  <p className="text-gray-300 text-sm">
                    <span className="font-semibold text-white">Tanda Penguasaan (Sertifikasi):</span>
                    <br />
                    {activeCandidate.knowledge.certifications.length > 0 ? (
                      activeCandidate.knowledge.certifications.map((cert, index) => (
                        <span key={index} className="inline-block bg-gray-600 text-white text-xs px-2 py-1 rounded-full mr-2 mb-1">{cert}</span>
                      ))
                    ) : (
                      "Belum ada tanda penguasaan khusus (sertifikasi) tercatat."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section: Why Better */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
              <h3 className="text-white text-xl font-semibold mb-4">
                Mengapa {activeCandidate.name.split(',')[0]} lebih baik dari yang lain?
              </h3>
              <div className="space-y-3 mb-6">
                {activeCandidateAdvantages.length > 0 ? (
                  activeCandidateAdvantages.map((advantage, index) => (
                    <div key={index} className="flex items-start text-gray-300 text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <div>
                        <span className="font-semibold text-white">{advantage.label}:</span> {advantage.value}
                        {advantage.details && (
                          <span
                            className="ml-2 text-blue-400 cursor-pointer hover:underline"
                            onClick={() => handleShowDetails(advantage.label, advantage.details)}
                          >
                            (Lihat Detail)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Tidak ada keunggulan spesifik yang teridentifikasi dibandingkan kandidat lain dalam kategori utama.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Tutup Papan Perbandingan
          </button>
        </div>

        {/* Floating Comparison List within DuelStatsModal */}
        <div className="fixed bottom-4 right-4 z-40">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-full shadow-lg p-3 cursor-pointer flex items-center justify-between"
            onClick={() => setShowFloatingList(!showFloatingList)}
            style={{ minWidth: '180px' }}
          >
            <span className="font-bold text-lg mr-2">VS</span>
            <span>{candidates.length} items selected</span>
            <svg className={`w-5 h-5 ml-2 transition-transform duration-300 ${showFloatingList ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </div>

          {showFloatingList && (
            <div className="absolute bottom-full right-0 mb-3 w-72 bg-gray-800 rounded-xl shadow-2xl p-4">
              <h3 className="text-white text-lg font-semibold mb-3">Daftar Perbandingan</h3>
              {candidates.length === 0 ? (
                <p className="text-gray-400 text-sm mb-3">Belum ada kandidat dipilih.</p>
              ) : (
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                      <span className="text-white text-sm truncate">{candidate.name.split(',')[0]}</span>
                      <button
                        onClick={() => onRemoveCandidate(candidate.id)} // Use onRemoveCandidate from props
                        className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center mt-4">
                <button
                  onClick={onClose} // Close the duel modal
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Tutup Duel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      {showDetailModal && (
        <PortfolioDetailModal
          title={detailModalContent.title}
          items={detailModalContent.items}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};


function App() {
  const [selectedSatker, setSelectedSatker] = useState('');
  const [selectedCandidateToAdd, setSelectedCandidateToAdd] = useState('');
  const [comparisonCandidates, setComparisonCandidates] = useState([]);
  const [showDuelModal, setShowDuelModal] = useState(false);

  // Data dummy untuk Satker dan Kandidat
  const satkerOptions = [
    { id: 'bps_sumut', name: 'BPS PROVINSI SUMATERA UTARA' },
    { id: 'bps_nias', name: 'BPS KABUPATEN NIAS' },
    { id: 'bps_mandailing_natal', name: 'BPS KABUPATEN MANDAILING NATAL' },
    { id: 'bps_tapanuli_selatan', name: 'BPS KABUPATEN TAPANULI SELATAN' },
    { id: 'bps_tapanuli_tengah', name: 'BPS KABUPATEN TAPANULI TENGAH' },
    { id: 'bps_tapanuli_utara', name: 'BPS KABUPATEN TAPANULI UTARA' },
    { id: 'bps_toba_samosir', name: 'BPS KABUPATEN TOBA SAMOSIR' },
    { id: 'bps_labuhanbatu', name: 'BPS KABUPATEN LABUHANBATU' },
    { id: 'bps_asahan', name: 'BPS KABUPATEN ASAHAN' },
    { id: 'bps_simalungun', name: 'BPS KABUPATEN SIMALUNGUN' },
    { id: 'bps_dairi', name: 'BPS KABUPATEN DAIRI' },
    { id: 'bps_karo', name: 'BPS KABUPATEN KARO' },
    { id: 'bps_deli_serdang', name: 'BPS KABUPATEN DELI SERDANG' },
    { id: 'bps_langkat', name: 'BPS KABUPATEN LANGKAT' },
    { id: 'bps_nias_selatan', name: 'BPS KABUPATEN NIAS SELATAN' },
    { id: 'bps_humbang_hasundutan', name: 'BPS KABUPATEN HUMBANG HASUNDUTAN' },
    { id: 'bps_pakpak_bharat', name: 'BPS KABUPATEN PAKPAK BHARAT' },
    { id: 'bps_samosir', name: 'BPS KABUPATEN SAMOSIR' },
    { id: 'bps_serdang_bedagai', name: 'BPS KABUPATEN SERDANG BEDAGAI' },
    { id: 'bps_batubara', name: 'BPS KABUPATEN BATU BARA' },
    { id: 'bps_padang_lawas', name: 'BPS KABUPATEN PADANG LAWAS' },
    { id: 'bps_padang_lawas_utara', name: 'BPS KABUPATEN PADANG LAWAS UTARA' },
    { id: 'bps_nias_utara', name: 'BPS KABUPATEN NIAS UTARA' },
    { id: 'bps_nias_barat', name: 'BPS KABUPATEN NIAS BARAT' },
    { id: 'bps_medan', name: 'BPS KOTA MEDAN' },
    { id: 'bps_pematangsiantar', name: 'BPS KOTA PEMATANGSIANTAR' },
    { id: 'bps_sibolga', name: 'BPS KOTA SIBOLGA' },
    { id: 'bps_tanjungbalai', name: 'BPS KOTA TANJUNGBALAI' },
    { id: 'bps_binjai', name: 'BPS KOTA BINJAI' },
    { id: 'bps_tebing_tinggi', name: 'BPS KOTA TEBING TINGGI' },
    { id: 'bps_padangsidimpuan', name: 'BPS KOTA PADANGSIDIMPUAN' },
    { id: 'bps_gunungsitoli', name: 'BPS KOTA GUNUNGSITOLI' },
  ];

  const allCandidates = [
    {
      id: '1',
      name: 'Didit Puji Hariyanto, SST',
      nip: 'NIP: 197503301996031002',
      position: 'Fungsional Umum Bagian Umum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'http://googleusercontent.com/file_content/0',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 15,
        educationTraining: 5,
        seminarsCertifications: 8,
        jobHistory: 3,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["15 tahun pengalaman kerja di BPS", "Bertanggung jawab atas operasional umum"],
        educationTrainingDetails: ["SST - Politeknik Statistika STIS", "Pelatihan Manajemen Proyek (2010)", "Workshop Data Analysis (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi Ahli Pengadaan Barang/Jasa (2018)", "Seminar Nasional Statistik (2020)"],
        jobHistoryDetails: ["Staf Umum BPS (2000-2010)", "Kepala Subbagian Umum (2010-sekarang)"],
        performanceAchievementsDetails: ["Meningkatkan efisiensi operasional sebesar 15%", "Berhasil mengelola anggaran departemen"],
      },
      knowledge: {
        skillSet: ["Manajemen Kantor", "Administrasi", "Pengelolaan Arsip"],
        certifications: ["Sertifikasi Pengadaan Barang/Jasa"],
      },
    },
    {
      id: '2',
      name: 'Bima Kebangkitan Naibaho',
      nip: 'NIP: 197503301996031002',
      position: 'Fungsional Umum Bagian Umum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'http://googleusercontent.com/file_content/0',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 12,
        educationTraining: 4,
        seminarsCertifications: 6,
        jobHistory: 2,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["12 tahun pengalaman kerja di BPS"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Sumatera Utara", "Pelatihan Keuangan Publik (2012)"],
        seminarsCertificationsDetails: ["Seminar Ekonomi Nasional (2018)", "Workshop Kebijakan Fiskal (2019)"],
        jobHistoryDetails: ["Staf Keuangan BPS (2005-2010)", "Analis Anggaran (2010-sekarang)"],
        performanceAchievementsDetails: ["Mengidentifikasi penghematan biaya operasional", "Berpartisipasi dalam penyusunan laporan keuangan"],
      },
      knowledge: {
        skillSet: ["Analisis Keuangan", "Akuntansi", "Ekonomi Publik"],
        certifications: [],
      },
    },
    {
      id: '3',
      name: 'Wirda Azhar Salwa, A.P.Kb.N.',
      nip: 'NIP: 200101082019122001',
      position: 'Fungsional Umum Bagian Umum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'http://googleusercontent.com/file_content/1',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 8,
        educationTraining: 3,
        seminarsCertifications: 5,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["8 tahun pengalaman di bidang kependudukan"],
        educationTrainingDetails: ["A.P.Kb.N. - Akademi Kependudukan Nasional", "Pelatihan Survei Demografi (2020)"],
        seminarsCertificationsDetails: ["Seminar Data Kependudukan (2021)"],
        jobHistoryDetails: ["Staf Analis Kependudukan (2019-sekarang)"],
        performanceAchievementsDetails: ["Berpartisipasi dalam sensus penduduk", "Menganalisis tren demografi regional"],
      },
      knowledge: {
        skillSet: ["Analisis Demografi", "Pengumpulan Data", "Statistik Kependudukan"],
        certifications: [],
      },
    },
    {
      id: '4',
      name: 'Sukron Al-Amin, S.Tr.Stat.',
      nip: 'NIP: 199906232022011001',
      position: 'Pranata Komputer Ahli Pertama BPS Provinsi',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'http://googleusercontent.com/file_content/1',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 10,
        educationTraining: 2,
        seminarsCertifications: 7,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["10 tahun pengalaman di bidang IT dan statistik"],
        educationTrainingDetails: ["S.Tr.Stat. - Politeknik Statistika STIS", "Pelatihan Pemrograman Python (2017)"],
        seminarsCertificationsDetails: ["Sertifikasi Data Scientist (2020)", "Workshop Big Data (2022)"],
        jobHistoryDetails: ["Staf IT BPS (2012-2018)", "Pranata Komputer Ahli Pertama (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan sistem basis data baru", "Meningkatkan keamanan jaringan"],
      },
      knowledge: {
        skillSet: ["Pemrograman Python", "Manajemen Basis Data", "Analisis Data", "Desain Infografis", "Menulis", "Bermain Instrumen Musik", "Komunikasi dan Negosiasi", "Public Speaking"],
        certifications: ["Sertifikasi Data Scientist"],
      },
    },
    {
      id: '5',
      name: 'Siti Aminah, S.E.',
      nip: 'NIP: 198005122005012003',
      position: 'Kepala Bagian Keuangan',
      organization: 'BPS KABUPATEN NIAS',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=SA',
      satkerId: 'bps_nias',
      stats: {
        totalExperience: 20,
        educationTraining: 7,
        seminarsCertifications: 10,
        jobHistory: 5,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["20 tahun pengalaman di bidang keuangan"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Indonesia", "Pelatihan Akuntansi Lanjutan (2008)", "Manajemen Keuangan Publik (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi Akuntan Publik (2010)", "Seminar Perpajakan (2019)"],
        jobHistoryDetails: ["Staf Keuangan (2005-2010)", "Kepala Subbagian Keuangan (2010-2018)", "Kepala Bagian Keuangan (2018-sekarang)"],
        performanceAchievementsDetails: ["Berhasil mengelola anggaran tahunan", "Menerapkan sistem pelaporan keuangan baru"],
      },
      knowledge: {
        skillSet: ["Akuntansi", "Manajemen Keuangan", "Perpajakan", "Audit"],
        certifications: ["Sertifikasi Akuntan Publik"],
      },
    },
    {
      id: '6',
      name: 'Rudi Hartono, S.Kom.',
      nip: 'NIP: 199009202015011005',
      position: 'Analis Data Senior',
      organization: 'BPS KABUPATEN MANDAILING NATAL',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=RH',
      satkerId: 'bps_mandailing_natal',
      stats: {
        totalExperience: 10,
        educationTraining: 3,
        seminarsCertifications: 6,
        jobHistory: 2,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["10 tahun pengalaman sebagai analis data"],
        educationTrainingDetails: ["S1 Ilmu Komputer - ITB", "Pelatihan Analisis Big Data (2017)"],
        seminarsCertificationsDetails: ["Sertifikasi Data Analyst (2019)", "Workshop Machine Learning (2021)"],
        jobHistoryDetails: ["Analis Data Junior (2015-2018)", "Analis Data Senior (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan model prediktif untuk data sensus", "Meningkatkan akurasi laporan data sebesar 10%"],
      },
      knowledge: {
        skillSet: ["Analisis Data", "SQL", "Python (Pandas, NumPy)", "Machine Learning"],
        certifications: ["Sertifikasi Data Analyst"],
      },
    },
    {
      id: '7',
      name: 'Dewi Lestari, S.Sos.',
      nip: 'NIP: 198501012010012004',
      position: 'Staf Administrasi',
      organization: 'BPS KABUPATEN TAPANULI SELATAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=DL',
      satkerId: 'bps_tapanuli_selatan',
      stats: {
        totalExperience: 8,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["8 tahun pengalaman di bidang administrasi"],
        educationTrainingDetails: ["S1 Sosiologi - Universitas Padjadjaran", "Pelatihan Kearsipan Digital (2015)"],
        seminarsCertificationsDetails: ["Workshop Administrasi Perkantoran (2017)"],
        jobHistoryDetails: ["Staf Administrasi (2010-sekarang)"],
        performanceAchievementsDetails: ["Mengelola dokumen kantor dengan efisien", "Mendukung kelancaran operasional harian"],
      },
      knowledge: {
        skillSet: ["Administrasi Kantor", "Kearsipan", "Komunikasi"],
        certifications: [],
      },
    },
    {
      id: '8',
      name: 'Joko Susilo, A.Md.',
      nip: 'NIP: 199203152018011006',
      position: 'Teknisi Komputer',
      organization: 'BPS KABUPATEN TAPANULI TENGAH',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=JS',
      satkerId: 'bps_tapanuli_tengah',
      stats: {
        totalExperience: 6,
        educationTraining: 1,
        seminarsCertifications: 2,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["6 tahun pengalaman sebagai teknisi komputer"],
        educationTrainingDetails: ["D3 Teknik Komputer - Politeknik Negeri Medan", "Pelatihan Perbaikan Hardware (2019)"],
        seminarsCertificationsDetails: ["Workshop Jaringan Komputer (2020)"],
        jobHistoryDetails: ["Teknisi Komputer (2018-sekarang)"],
        performanceAchievementsDetails: ["Memperbaiki masalah hardware dan software", "Memastikan jaringan kantor berfungsi baik"],
      },
      knowledge: {
        skillSet: ["Perbaikan Komputer", "Jaringan Komputer", "Troubleshooting"],
        certifications: [],
      },
    },
    {
      id: '9',
      name: 'Putri Indah, S.Pd.',
      nip: 'NIP: 198807202012012007',
      position: 'Analis Statistik',
      organization: 'BPS KABUPATEN TAPANULI UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=PI',
      satkerId: 'bps_tapanuli_utara',
      stats: {
        totalExperience: 10,
        educationTraining: 4,
        seminarsCertifications: 5,
        jobHistory: 2,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["10 tahun pengalaman sebagai analis statistik"],
        educationTrainingDetails: ["S1 Pendidikan Matematika - Universitas Negeri Medan", "Pelatihan Metodologi Survei (2016)"],
        seminarsCertificationsDetails: ["Seminar Nasional Statistik (2018)", "Workshop Analisis Data Spasial (2020)"],
        jobHistoryDetails: ["Staf Analis Statistik (2012-2017)", "Analis Statistik (2017-sekarang)"],
        performanceAchievementsDetails: ["Melakukan analisis data untuk publikasi BPS", "Berpartisipasi dalam penyusunan laporan statistik"],
      },
      knowledge: {
        skillSet: ["Analisis Statistik", "Metodologi Survei", "SPSS", "Excel"],
        certifications: [],
      },
    },
    {
      id: '10',
      name: 'Agus Salim, S.H.',
      nip: 'NIP: 197011051995031008',
      position: 'Kabag Hukum',
      organization: 'BPS KABUPATEN TOBA SAMOSIR',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=AS',
      satkerId: 'bps_toba_samosir',
      stats: {
        totalExperience: 25,
        educationTraining: 8,
        seminarsCertifications: 12,
        jobHistory: 6,
        performanceAchievements: 10,
      },
      portfolio: {
        totalExperienceDetails: ["25 tahun pengalaman di bidang hukum pemerintahan"],
        educationTrainingDetails: ["S1 Hukum - Universitas Gadjah Mada", "Pelatihan Hukum Administrasi Negara (2000)", "Pendidikan Khusus Profesi Advokat (2005)"],
        seminarsCertificationsDetails: ["Seminar Hukum Tata Negara (2010)", "Workshop Peraturan Perundang-undangan (2018)"],
        jobHistoryDetails: ["Staf Hukum (1995-2005)", "Kepala Subbagian Perundang-undangan (2005-2015)", "Kabag Hukum (2015-sekarang)"],
        performanceAchievementsDetails: ["Menyusun berbagai regulasi internal", "Memberikan konsultasi hukum yang efektif"],
      },
      knowledge: {
        skillSet: ["Hukum Administrasi", "Hukum Perdata", "Litigasi", "Negosiasi"],
        certifications: ["Sertifikasi Advokat"],
      },
    },
    {
      id: '11',
      name: 'Budi Santoso, S.T.',
      nip: 'NIP: 198304222008011009',
      position: 'Kepala Seksi Data',
      organization: 'BPS KABUPATEN LABUHANBATU',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=BS',
      satkerId: 'bps_labuhanbatu',
      stats: {
        totalExperience: 17,
        educationTraining: 6,
        seminarsCertifications: 9,
        jobHistory: 4,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["17 tahun pengalaman di bidang data dan IT"],
        educationTrainingDetails: ["S1 Teknik Informatika - Universitas Diponegoro", "Pelatihan Basis Data Lanjutan (2012)", "Manajemen Proyek IT (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Oracle Database (2015)", "Seminar Keamanan Siber (2020)"],
        jobHistoryDetails: ["Staf IT (2008-2013)", "Analis Sistem (2013-2018)", "Kepala Seksi Data (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan sistem data terintegrasi", "Meningkatkan kualitas data sensus"],
      },
      knowledge: {
        skillSet: ["Basis Data (SQL, NoSQL)", "Manajemen Sistem", "Keamanan Jaringan", "Pemrograman Java"],
        certifications: ["Sertifikasi Oracle Database"],
      },
    },
    {
      id: '12',
      name: 'Citra Kirana, A.Md.Stat.',
      nip: 'NIP: 199509012020012010',
      position: 'Statistisi Pelaksana',
      organization: 'BPS KABUPATEN ASAHAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=CK',
      satkerId: 'bps_asahan',
      stats: {
        totalExperience: 4,
        educationTraining: 1,
        seminarsCertifications: 1,
        jobHistory: 0,
        performanceAchievements: 3,
      },
      portfolio: {
        totalExperienceDetails: ["4 tahun pengalaman sebagai statistisi"],
        educationTrainingDetails: ["D3 Statistika - Politeknik Statistika STIS", "Pelatihan Pengolahan Data (2021)"],
        seminarsCertificationsDetails: ["Workshop Dasar Statistika (2022)"],
        jobHistoryDetails: ["Statistisi Pelaksana (2020-sekarang)"],
        performanceAchievementsDetails: ["Membantu pengumpulan data survei", "Melakukan entri data dengan akurat"],
      },
      knowledge: {
        skillSet: ["Pengolahan Data", "Statistika Dasar", "Microsoft Excel"],
        certifications: [],
      },
    },
    {
      id: '13',
      name: 'Dedi Kurniawan, S.E.',
      nip: 'NIP: 197802102003011011',
      position: 'Kepala Subbagian Umum',
      organization: 'BPS KABUPATEN SIMALUNGUN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=DK',
      satkerId: 'bps_simalungun',
      stats: {
        totalExperience: 22,
        educationTraining: 7,
        seminarsCertifications: 11,
        jobHistory: 5,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["22 tahun pengalaman di bidang administrasi umum"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Airlangga", "Pelatihan Manajemen Logistik (2008)", "Kepemimpinan Efektif (2017)"],
        seminarsCertificationsDetails: ["Sertifikasi Manajemen Risiko (2015)", "Seminar Tata Kelola Pemerintahan (2020)"],
        jobHistoryDetails: ["Staf Administrasi (2003-2008)", "Kepala Seksi Umum (2008-2015)", "Kepala Subbagian Umum (2015-sekarang)"],
        performanceAchievementsDetails: ["Meningkatkan efisiensi administrasi kantor", "Mengelola aset kantor dengan baik"],
      },
      knowledge: {
        skillSet: ["Manajemen Administrasi", "Logistik", "Kepemimpinan", "Pengelolaan Aset"],
        certifications: ["Sertifikasi Manajemen Risiko"],
      },
    },
    {
      id: '14',
      name: 'Eka Putri, S.Kom.',
      nip: 'NIP: 199006052015012012',
      position: 'Analis Jaringan',
      organization: 'BPS KABUPATEN DAIRI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=EP',
      satkerId: 'bps_dairi',
      stats: {
        totalExperience: 9,
        educationTraining: 3,
        seminarsCertifications: 4,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["9 tahun pengalaman sebagai analis jaringan"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Brawijaya", "Pelatihan Jaringan Cisco (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi CCNA (2019)", "Workshop Keamanan Jaringan (2021)"],
        jobHistoryDetails: ["Staf IT (2015-2018)", "Analis Jaringan (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengoptimalkan kinerja jaringan kantor", "Mengimplementasikan solusi keamanan jaringan"],
      },
      knowledge: {
        skillSet: ["Jaringan Komputer", "Keamanan Jaringan", "Cisco", "Linux"],
        certifications: ["Sertifikasi CCNA"],
      },
    },
    {
      id: '15',
      name: 'Fajar Nugraha, S.I.P.',
      nip: 'NIP: 198212252007011013',
      position: 'Analis Kepegawaian',
      organization: 'BPS KABUPATEN KARO',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=FN',
      satkerId: 'bps_karo',
      stats: {
        totalExperience: 18,
        educationTraining: 5,
        seminarsCertifications: 8,
        jobHistory: 4,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["18 tahun pengalaman di bidang kepegawaian"],
        educationTrainingDetails: ["S1 Ilmu Pemerintahan - Universitas Gadjah Mada", "Pelatihan Manajemen SDM (2010)", "Hukum Ketenagakerjaan (2016)"],
        seminarsCertificationsDetails: ["Sertifikasi HR Professional (2015)", "Seminar Kebijakan Publik (2019)"],
        jobHistoryDetails: ["Staf Kepegawaian (2007-2012)", "Kepala Subbagian Kepegawaian (2012-2018)", "Analis Kepegawaian (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan sistem penilaian kinerja pegawai", "Menyusun kebijakan kepegawaian yang adil"],
      },
      knowledge: {
        skillSet: ["Manajemen SDM", "Hukum Ketenagakerjaan", "Penilaian Kinerja", "Pengembangan Organisasi"],
        certifications: ["Sertifikasi HR Professional"],
      },
    },
    {
      id: '16',
      name: 'Gita Permata, S.Farm.',
      nip: 'NIP: 199308102018012014',
      position: 'Staf Umum',
      organization: 'BPS KABUPATEN DELI SERDANG',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=GP',
      satkerId: 'bps_deli_serdang',
      stats: {
        totalExperience: 5,
        educationTraining: 2,
        seminarsCertifications: 2,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["5 tahun pengalaman sebagai staf umum"],
        educationTrainingDetails: ["S1 Farmasi - Universitas Pancasila", "Pelatihan Administrasi Dasar (2019)"],
        seminarsCertificationsDetails: ["Workshop Komunikasi Efektif (2020)"],
        jobHistoryDetails: ["Staf Umum (2018-sekarang)"],
        performanceAchievementsDetails: ["Mendukung kegiatan administrasi harian", "Berpartisipasi dalam pengadaan barang kantor"],
      },
      knowledge: {
        skillSet: ["Administrasi Dasar", "Komunikasi", "Pengelolaan Dokumen"],
        certifications: [],
      },
    },
    {
      id: '17',
      name: 'Hendra Wijaya, S.Pd.',
      nip: 'NIP: 197603032001011015',
      position: 'Kepala Seksi Sosial',
      organization: 'BPS KABUPATEN LANGKAT',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=HW',
      satkerId: 'bps_langkat',
      stats: {
        totalExperience: 24,
        educationTraining: 9,
        seminarsCertifications: 13,
        jobHistory: 7,
        performanceAchievements: 10,
      },
      portfolio: {
        totalExperienceDetails: ["24 tahun pengalaman di bidang sosial dan pendidikan"],
        educationTrainingDetails: ["S1 Pendidikan - Universitas Pendidikan Indonesia", "Pelatihan Analisis Sosial (2005)", "Metodologi Penelitian Kualitatif (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi Konselor Pendidikan (2010)", "Seminar Pembangunan Sosial (2020)"],
        jobHistoryDetails: ["Guru (2001-2006)", "Staf Analis Sosial BPS (2006-2012)", "Kepala Seksi Sosial (2012-sekarang)"],
        performanceAchievementsDetails: ["Melakukan penelitian sosial yang berdampak", "Mengembangkan program pemberdayaan masyarakat"],
      },
      knowledge: {
        skillSet: ["Analisis Sosial", "Penelitian Kualitatif", "Pendidikan", "Pemberdayaan Masyarakat"],
        certifications: ["Sertifikasi Konselor Pendidikan"],
      },
    },
    {
      id: '18',
      name: 'Indah Sari, S.E.',
      nip: 'NIP: 198905202014012016',
      position: 'Bendahara',
      organization: 'BPS KABUPATEN NIAS SELATAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=IS',
      satkerId: 'bps_nias_selatan',
      stats: {
        totalExperience: 11,
        educationTraining: 3,
        seminarsCertifications: 5,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["11 tahun pengalaman sebagai bendahara"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Andalas", "Pelatihan Perpajakan (2016)"],
        seminarsCertificationsDetails: ["Workshop Pelaporan Keuangan (2018)"],
        jobHistoryDetails: ["Staf Keuangan (2014-2017)", "Bendahara (2017-sekarang)"],
        performanceAchievementsDetails: ["Mengelola kas dan bank dengan teliti", "Memastikan kepatuhan pajak"],
      },
      knowledge: {
        skillSet: ["Pembukuan", "Perpajakan", "Pelaporan Keuangan", "Microsoft Office"],
        certifications: [],
      },
    },
    {
      id: '19',
      name: 'Kevin Pratama, S.Kom.',
      nip: 'NIP: 199410102019011017',
      position: 'Programmer',
      organization: 'BPS KABUPATEN HUMBANG HASUNDUTAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=KP',
      satkerId: 'bps_humbang_hasundutan',
      stats: {
        totalExperience: 5,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["5 tahun pengalaman sebagai programmer"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Telkom", "Pelatihan Pengembangan Web (2020)"],
        seminarsCertificationsDetails: ["Sertifikasi Full-stack Developer (2021)"],
        jobHistoryDetails: ["Junior Programmer (2019-2021)", "Programmer (2021-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan aplikasi internal BPS", "Meningkatkan efisiensi proses bisnis melalui otomasi"],
      },
      knowledge: {
        skillSet: ["JavaScript", "React", "Node.js", "SQL", "HTML", "CSS"],
        certifications: ["Sertifikasi Full-stack Developer"],
      },
    },
    {
      id: '20',
      name: 'Lina Marlina, S.Sos.',
      nip: 'NIP: 198001012005012018',
      position: 'Analis Kependudukan',
      organization: 'BPS KABUPATEN PAKPAK BHARAT',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=LM',
      satkerId: 'bps_pakpak_bharat',
      stats: {
        totalExperience: 20,
        educationTraining: 6,
        seminarsCertifications: 10,
        jobHistory: 5,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["20 tahun pengalaman di bidang analisis kependudukan"],
        educationTrainingDetails: ["S1 Sosiologi - Universitas Airlangga", "Pelatihan Demografi Lanjutan (2010)", "Metodologi Survei Sosial (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Analis Data Sosial (2015)", "Seminar Isu Kependudukan Kontemporer (2021)"],
        jobHistoryDetails: ["Staf Analis Sosial (2005-2010)", "Kepala Seksi Kependudukan (2010-2018)", "Analis Kependudukan (2018-sekarang)"],
        performanceAchievementsDetails: ["Melakukan analisis mendalam tentang data demografi", "Berpartisipasi aktif dalam penyusunan publikasi kependudukan"],
      },
      knowledge: {
        skillSet: ["Analisis Demografi", "Metodologi Survei", "SPSS", "Penelitian Sosial"],
        certifications: ["Sertifikasi Analis Data Sosial"],
      },
    },
    {
      id: '21',
      name: 'M. Iqbal, S.T.',
      nip: 'NIP: 197507072000011019',
      position: 'Kepala Seksi Produksi',
      organization: 'BPS KABUPATEN SAMOSIR',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=MI',
      satkerId: 'bps_samosir',
      stats: {
        totalExperience: 23,
        educationTraining: 8,
        seminarsCertifications: 12,
        jobHistory: 6,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["23 tahun pengalaman di bidang produksi statistik"],
        educationTrainingDetails: ["S1 Teknik Industri - Institut Teknologi Bandung", "Pelatihan Manajemen Produksi (2005)", "Quality Control Statistik (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi Six Sigma Green Belt (2010)", "Workshop Inovasi Proses Statistik (2020)"],
        jobHistoryDetails: ["Staf Produksi (2000-2007)", "Kepala Subbagian Produksi (2007-2015)", "Kepala Seksi Produksi (2015-sekarang)"],
        performanceAchievementsDetails: ["Mengoptimalkan alur kerja produksi data", "Meningkatkan kualitas output statistik"],
      },
      knowledge: {
        skillSet: ["Manajemen Produksi", "Quality Control", "Statistika Industri", "Manajemen Proyek"],
        certifications: ["Sertifikasi Six Sigma Green Belt"],
      },
    },
    {
      id: '22',
      name: 'Nia Ramadhani, A.Md.',
      nip: 'NIP: 199102142016012020',
      position: 'Staf Tata Usaha',
      organization: 'BPS KABUPATEN SERDANG BEDAGAI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=NR',
      satkerId: 'bps_serdang_bedagai',
      stats: {
        totalExperience: 7,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["7 tahun pengalaman di bidang tata usaha"],
        educationTrainingDetails: ["D3 Administrasi Perkantoran - Politeknik Negeri Jakarta", "Pelatihan Pengelolaan Dokumen (2018)"],
        seminarsCertificationsDetails: ["Workshop Etika Komunikasi Kantor (2019)"],
        jobHistoryDetails: ["Staf Tata Usaha (2016-sekarang)"],
        performanceAchievementsDetails: ["Mengelola surat-menyurat dan arsip dengan rapi", "Mendukung kebutuhan administrasi pimpinan"],
      },
      knowledge: {
        skillSet: ["Administrasi Perkantoran", "Kearsipan", "Komunikasi Bisnis"],
        certifications: [],
      },
    },
    {
      id: '23',
      name: 'Omar Syarief, S.H.',
      nip: 'NIP: 198409092009011021',
      position: 'Analis Hukum',
      organization: 'BPS KABUPATEN BATU BARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=OS',
      satkerId: 'bps_batubara',
      stats: {
        totalExperience: 16,
        educationTraining: 5,
        seminarsCertifications: 7,
        jobHistory: 3,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["16 tahun pengalaman sebagai analis hukum"],
        educationTrainingDetails: ["S1 Hukum - Universitas Padjadjaran", "Pelatihan Perancangan Peraturan (2012)", "Hukum Kontrak (2017)"],
        seminarsCertificationsDetails: ["Seminar Hukum Administrasi Negara (2015)", "Workshop Legal Drafting (2020)"],
        jobHistoryDetails: ["Staf Hukum (2009-2014)", "Analis Hukum (2014-sekarang)"],
        performanceAchievementsDetails: ["Memberikan analisis hukum yang akurat", "Membantu penyelesaian sengketa hukum"],
      },
      knowledge: {
        skillSet: ["Analisis Hukum", "Legal Drafting", "Hukum Perdata", "Hukum Administrasi"],
        certifications: [],
      },
    },
    {
      id: '24',
      name: 'Putra Jaya, S.Kom.',
      nip: 'NIP: 199604042021011022',
      position: 'Pengelola Data',
      organization: 'BPS KABUPATEN PADANG LAWAS',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=PJ',
      satkerId: 'bps_padang_lawas',
      stats: {
        totalExperience: 3,
        educationTraining: 1,
        seminarsCertifications: 1,
        jobHistory: 0,
        performanceAchievements: 2,
      },
      portfolio: {
        totalExperienceDetails: ["3 tahun pengalaman sebagai pengelola data"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Riau", "Pelatihan Entry Data (2022)"],
        seminarsCertificationsDetails: ["Workshop Dasar Pengolahan Data (2023)"],
        jobHistoryDetails: ["Pengelola Data (2021-sekarang)"],
        performanceAchievementsDetails: ["Memastikan integritas data", "Melakukan pembersihan data secara rutin"],
      },
      knowledge: {
        skillSet: ["Entry Data", "Pembersihan Data", "Microsoft Excel"],
        certifications: [],
      },
    },
    {
      id: '25',
      name: 'Qori Hafizah, S.Pd.',
      nip: 'NIP: 198711112012012023',
      position: 'Staf Pendidikan',
      organization: 'BPS KABUPATEN PADANG LAWAS UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=QH',
      satkerId: 'bps_padang_lawas_utara',
      stats: {
        totalExperience: 12,
        educationTraining: 4,
        seminarsCertifications: 6,
        jobHistory: 2,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["12 tahun pengalaman di bidang pendidikan"],
        educationTrainingDetails: ["S1 Pendidikan Bahasa Inggris - Universitas Negeri Jakarta", "Pelatihan Pengembangan Kurikulum (2015)"],
        seminarsCertificationsDetails: ["Seminar Inovasi Pendidikan (2018)", "Workshop Metodologi Pengajaran (2020)"],
        jobHistoryDetails: ["Guru Bahasa Inggris (2012-2017)", "Staf Pendidikan BPS (2017-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan materi edukasi statistik", "Melakukan sosialisasi statistik kepada masyarakat"],
      },
      knowledge: {
        skillSet: ["Pengembangan Kurikulum", "Metodologi Pengajaran", "Komunikasi Publik"],
        certifications: [],
      },
    },
    {
      id: '26',
      name: 'Rizky Fadillah, S.E.',
      nip: 'NIP: 199806062023011024',
      position: 'Staf Keuangan',
      organization: 'BPS KABUPATEN NIAS UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=RF',
      satkerId: 'bps_nias_utara',
      stats: {
        totalExperience: 2,
        educationTraining: 0,
        seminarsCertifications: 1,
        jobHistory: 0,
        performanceAchievements: 1,
      },
      portfolio: {
        totalExperienceDetails: ["2 tahun pengalaman di bidang keuangan"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Riau", "Pelatihan Dasar Akuntansi (2023)"],
        seminarsCertificationsDetails: ["Workshop Pengelolaan Keuangan Pribadi (2024)"],
        jobHistoryDetails: ["Staf Keuangan (2023-sekarang)"],
        performanceAchievementsDetails: ["Membantu dalam proses pembukuan", "Mempelajari sistem keuangan kantor"],
      },
      knowledge: {
        skillSet: ["Dasar Akuntansi", "Microsoft Excel"],
        certifications: [],
      },
    },
    {
      id: '27',
      name: 'Santi Dewi, A.Md.Stat.',
      nip: 'NIP: 199003032015012025',
      position: 'Statistisi Ahli',
      organization: 'BPS KABUPATEN NIAS BARAT',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=SD',
      satkerId: 'bps_nias_barat',
      stats: {
        totalExperience: 10,
        educationTraining: 3,
        seminarsCertifications: 5,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["10 tahun pengalaman sebagai statistisi ahli"],
        educationTrainingDetails: ["D3 Statistika - Politeknik Statistika STIS", "Pelatihan Analisis Multivariat (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Analis Data (2019)", "Seminar Statistika Terapan (2021)"],
        jobHistoryDetails: ["Statistisi Pelaksana (2015-2018)", "Statistisi Ahli (2018-sekarang)"],
        performanceAchievementsDetails: ["Melakukan analisis data kompleks", "Memberikan rekomendasi kebijakan berdasarkan data"],
      },
      knowledge: {
        skillSet: ["Analisis Statistik Lanjutan", "SPSS", "R Programming", "Visualisasi Data"],
        certifications: ["Sertifikasi Analis Data"],
      },
    },
    {
      id: '28',
      name: 'Taufik Hidayat, S.Kom.',
      nip: 'NIP: 198109192006011026',
      position: 'Kepala Seksi Integrasi Pengolahan Data',
      organization: 'BPS KOTA MEDAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=TH',
      satkerId: 'bps_medan',
      stats: {
        totalExperience: 19,
        educationTraining: 6,
        seminarsCertifications: 10,
        jobHistory: 4,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["19 tahun pengalaman di bidang IT dan data"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Sumatera Utara", "Pelatihan Integrasi Sistem (2010)", "Big Data Management (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi IT Project Manager (2015)", "Workshop Data Warehousing (2020)"],
        jobHistoryDetails: ["Staf IT (2006-2011)", "Analis Sistem (2011-2016)", "Kepala Seksi Integrasi Pengolahan Data (2016-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan arsitektur data terintegrasi", "Meningkatkan efisiensi pengolahan data"],
      },
      knowledge: {
        skillSet: ["Integrasi Sistem", "Manajemen Basis Data", "Big Data", "Project Management"],
        certifications: ["Sertifikasi IT Project Manager"],
      },
    },
    {
      id: '29',
      name: 'Umi Kalsum, S.Sos.',
      nip: 'NIP: 197904042004012027',
      position: 'Analis Sosial',
      organization: 'BPS KOTA PEMATANGSIANTAR',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=UK',
      satkerId: 'bps_pematangsiantar',
      stats: {
        totalExperience: 21,
        educationTraining: 7,
        seminarsCertifications: 11,
        jobHistory: 5,
        performanceAchievements: 10,
      },
      portfolio: {
        totalExperienceDetails: ["21 tahun pengalaman sebagai analis sosial"],
        educationTrainingDetails: ["S1 Sosiologi - Universitas Indonesia", "Pelatihan Penelitian Sosial Kualitatif (2009)", "Analisis Kebijakan Sosial (2017)"],
        seminarsCertificationsDetails: ["Sertifikasi Peneliti Sosial (2014)", "Seminar Pembangunan Berkelanjutan (2022)"],
        jobHistoryDetails: ["Staf Analis Sosial (2004-2009)", "Kepala Seksi Sosial (2009-2017)", "Analis Sosial (2017-sekarang)"],
        performanceAchievementsDetails: ["Melakukan studi sosial yang mendalam", "Memberikan rekomendasi kebijakan berbasis bukti"],
      },
      knowledge: {
        skillSet: ["Penelitian Sosial", "Analisis Kebijakan", "Sosiologi", "Etnografi"],
        certifications: ["Sertifikasi Peneliti Sosial"],
      },
    },
    {
      id: '30',
      name: 'Vina Lestari, S.E.',
      nip: 'NIP: 199208082017012028',
      position: 'Staf Pemasaran',
      organization: 'BPS KOTA SIBOLGA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=VL',
      satkerId: 'bps_sibolga',
      stats: {
        totalExperience: 7,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["7 tahun pengalaman di bidang pemasaran"],
        educationTrainingDetails: ["S1 Manajemen - Universitas Kristen Indonesia", "Pelatihan Pemasaran Digital (2019)"],
        seminarsCertificationsDetails: ["Workshop Strategi Komunikasi (2020)"],
        jobHistoryDetails: ["Staf Pemasaran (2017-sekarang)"],
        performanceAchievementsDetails: ["Meningkatkan visibilitas publikasi BPS", "Mengelola media sosial kantor"],
      },
      knowledge: {
        skillSet: ["Pemasaran Digital", "Manajemen Media Sosial", "Komunikasi Pemasaran"],
        certifications: [],
      },
    },
    {
      id: '31',
      name: 'Wahyu Nugroho, S.T.',
      nip: 'NIP: 198610102011011029',
      position: 'Kepala Seksi Distribusi',
      organization: 'BPS KOTA TANJUNGBALAI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=WN',
      satkerId: 'bps_tanjungbalai',
      stats: {
        totalExperience: 14,
        educationTraining: 4,
        seminarsCertifications: 7,
        jobHistory: 3,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["14 tahun pengalaman di bidang distribusi data"],
        educationTrainingDetails: ["S1 Teknik Industri - Universitas Sebelas Maret", "Pelatihan Logistik dan Rantai Pasok (2014)"],
        seminarsCertificationsDetails: ["Sertifikasi Supply Chain Management (2017)", "Workshop Optimasi Distribusi (2020)"],
        jobHistoryDetails: ["Staf Distribusi (2011-2015)", "Kepala Subbagian Distribusi (2015-2019)", "Kepala Seksi Distribusi (2019-sekarang)"],
        performanceAchievementsDetails: ["Mengoptimalkan proses distribusi data", "Memastikan data sampai ke pengguna tepat waktu"],
      },
      knowledge: {
        skillSet: ["Manajemen Logistik", "Rantai Pasok", "Optimasi Proses", "Distribusi Data"],
        certifications: ["Sertifikasi Supply Chain Management"],
      },
    },
    {
      id: '32',
      name: 'Xena Putri, A.Md.',
      nip: 'NIP: 199701012022012030',
      position: 'Staf Umum',
      organization: 'BPS KOTA BINJAI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=XP',
      satkerId: 'bps_binjai',
      stats: {
        totalExperience: 2,
        educationTraining: 1,
        seminarsCertifications: 0,
        jobHistory: 0,
        performanceAchievements: 2,
      },
      portfolio: {
        totalExperienceDetails: ["2 tahun pengalaman sebagai staf umum"],
        educationTrainingDetails: ["D3 Administrasi Bisnis - Politeknik Negeri Bandung", "Pelatihan Komunikasi Dasar (2023)"],
        seminarsCertificationsDetails: [],
        jobHistoryDetails: ["Staf Umum (2022-sekarang)"],
        performanceAchievementsDetails: ["Membantu dalam kegiatan administrasi", "Cepat beradaptasi dengan lingkungan kerja baru"],
      },
      knowledge: {
        skillSet: ["Administrasi Dasar", "Komunikasi"],
        certifications: [],
      },
    },
    {
      id: '33',
      name: 'Yudi Santoso, S.H.',
      nip: 'NIP: 198002022005011031',
      position: 'Analis Hukum',
      organization: 'BPS KOTA TEBING TINGGI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=YS',
      satkerId: 'bps_tebing_tinggi',
      stats: {
        totalExperience: 20,
        educationTraining: 6,
        seminarsCertifications: 9,
        jobHistory: 5,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["20 tahun pengalaman sebagai analis hukum"],
        educationTrainingDetails: ["S1 Hukum - Universitas Diponegoro", "Pelatihan Hukum Pidana (2010)", "Hukum Perdata Lanjutan (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Mediator (2015)", "Workshop Hukum Acara (2021)"],
        jobHistoryDetails: ["Staf Hukum (2005-2010)", "Analis Hukum (2010-sekarang)"],
        performanceAchievementsDetails: ["Memberikan saran hukum yang komprehensif", "Berhasil menyelesaikan kasus-kasus hukum"],
      },
      knowledge: {
        skillSet: ["Hukum Pidana", "Hukum Perdata", "Mediasi", "Legal Research"],
        certifications: ["Sertifikasi Mediator"],
      },
    },
    {
      id: '34',
      name: 'Zahra Fitri, S.Kom.',
      nip: 'NIP: 199307072018012032',
      position: 'Pengembang Web',
      organization: 'BPS KOTA PADANGSIDIMPUAN',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=ZF',
      satkerId: 'bps_padangsidimpuan',
      stats: {
        totalExperience: 6,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["6 tahun pengalaman sebagai pengembang web"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Negeri Padang", "Pelatihan Frontend Development (2019)"],
        seminarsCertificationsDetails: ["Sertifikasi Web Developer (2020)", "Workshop UI/UX Design (2022)"],
        jobHistoryDetails: ["Junior Web Developer (2018-2020)", "Pengembang Web (2020-sekarang)"],
        performanceAchievementsDetails: ["Mengembangkan website interaktif BPS", "Meningkatkan pengalaman pengguna situs web"],
      },
      knowledge: {
        skillSet: ["HTML", "CSS", "JavaScript", "React", "UI/UX Design"],
        certifications: ["Sertifikasi Web Developer"],
      },
    },
    {
      id: '35',
      name: 'Adam Malik, S.E.',
      nip: 'NIP: 197709092002011033',
      position: 'Kepala Bagian Umum',
      organization: 'BPS KOTA GUNUNGSITOLI',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=AM',
      satkerId: 'bps_gunungsitoli',
      stats: {
        totalExperience: 23,
        educationTraining: 8,
        seminarsCertifications: 12,
        jobHistory: 6,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["23 tahun pengalaman di bidang manajemen umum"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Hasanuddin", "Pelatihan Manajemen Strategis (2007)", "Kepemimpinan Transformasional (2016)"],
        seminarsCertificationsDetails: ["Sertifikasi Manajer Proyek (2012)", "Seminar Tata Kelola Organisasi (2019)"],
        jobHistoryDetails: ["Staf Umum (2002-2007)", "Kepala Subbagian Umum (2007-2015)", "Kepala Bagian Umum (2015-sekarang)"],
        performanceAchievementsDetails: ["Mengelola operasional kantor secara efektif", "Meningkatkan kinerja tim secara keseluruhan"],
      },
      knowledge: {
        skillSet: ["Manajemen Umum", "Kepemimpinan", "Manajemen Proyek", "Pengambilan Keputusan"],
        certifications: ["Sertifikasi Manajer Proyek"],
      },
    },
    {
      id: '36',
      name: 'Yunus, S.Si',
      nip: 'NIP: 198501012010011001',
      position: 'Statistisi',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=YS',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 10,
        educationTraining: 3,
        seminarsCertifications: 5,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["10 tahun pengalaman sebagai statistisi"],
        educationTrainingDetails: ["S1 Statistika - Universitas Gadjah Mada", "Pelatihan Analisis Data (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi SPSS (2017)", "Workshop Visualisasi Data (2019)"],
        jobHistoryDetails: ["Staf Statistisi (2010-2015)", "Statistisi (2015-sekarang)"],
        performanceAchievementsDetails: ["Melakukan pengolahan dan analisis data survei", "Menyusun laporan statistik berkala"],
      },
      knowledge: {
        skillSet: ["Statistika", "Analisis Data", "SPSS", "Visualisasi Data"],
        certifications: ["Sertifikasi SPSS"],
      },
    },
    {
      id: '37',
      name: 'Reni Agustini, S.Si.',
      nip: 'NIP: 199002022015012002',
      position: 'Analis Statistik',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=RA',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 8,
        educationTraining: 2,
        seminarsCertifications: 4,
        jobHistory: 1,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["8 tahun pengalaman sebagai analis statistik"],
        educationTrainingDetails: ["S1 Statistika - Universitas Padjadjaran", "Pelatihan Metodologi Penelitian (2018)"],
        seminarsCertificationsDetails: ["Workshop Statistika Non-parametrik (2020)"],
        jobHistoryDetails: ["Analis Statistik (2015-sekarang)"],
        performanceAchievementsDetails: ["Melakukan analisis data untuk publikasi ilmiah", "Berpartisipasi dalam pengembangan kuesioner survei"],
      },
      knowledge: {
        skillSet: ["Analisis Statistik", "Metodologi Penelitian", "R Programming", "Survei Desain"],
        certifications: [],
      },
    },
    {
      id: '38',
      name: 'Raymond Orlando Parasian Simanjuntak, S.H.',
      nip: 'NIP: 198803032013011003',
      position: 'Analis Hukum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=RS',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 12,
        educationTraining: 4,
        seminarsCertifications: 6,
        jobHistory: 2,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["12 tahun pengalaman sebagai analis hukum"],
        educationTrainingDetails: ["S1 Hukum - Universitas Katolik Parahyangan", "Pelatihan Hukum Perdata (2016)", "Hukum Administrasi Negara (2019)"],
        seminarsCertificationsDetails: ["Seminar Hukum Lingkungan (2018)", "Workshop Legal Opinion (2021)"],
        jobHistoryDetails: ["Staf Hukum (2013-2017)", "Analis Hukum (2017-sekarang)"],
        performanceAchievementsDetails: ["Memberikan konsultasi hukum internal", "Menyusun draf perjanjian dan regulasi"],
      },
      knowledge: {
        skillSet: ["Hukum Perdata", "Hukum Administrasi", "Legal Research", "Kontrak"],
        certifications: [],
      },
    },
    {
      id: '39',
      name: 'Nurbaiti, S.E., M.Si.',
      nip: 'NIP: 197804042003012004',
      position: 'Kepala Bagian Keuangan',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=NB',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 22,
        educationTraining: 7,
        seminarsCertifications: 11,
        jobHistory: 5,
        performanceAchievements: 9,
      },
      portfolio: {
        totalExperienceDetails: ["22 tahun pengalaman di bidang keuangan dan manajemen"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Sumatera Utara", "S2 Manajemen - Universitas Gadjah Mada", "Pelatihan Perencanaan Keuangan (2008)"],
        seminarsCertificationsDetails: ["Sertifikasi Manajemen Keuangan (2012)", "Seminar Tata Kelola Perusahaan (2019)"],
        jobHistoryDetails: ["Staf Keuangan (2003-2008)", "Kepala Subbagian Keuangan (2008-2015)", "Kepala Bagian Keuangan (2015-sekarang)"],
        performanceAchievementsDetails: ["Mengelola anggaran departemen secara efektif", "Meningkatkan efisiensi pengeluaran"],
      },
      knowledge: {
        skillSet: ["Manajemen Keuangan", "Akuntansi", "Perencanaan Strategis", "Kepemimpinan"],
        certifications: ["Sertifikasi Manajemen Keuangan"],
      },
    },
    {
      id: '40',
      name: 'Winny Saraswati, SE',
      nip: 'NIP: 198205052007012005',
      position: 'Staf Keuangan',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=WS',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 18,
        educationTraining: 5,
        seminarsCertifications: 8,
        jobHistory: 4,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["18 tahun pengalaman sebagai staf keuangan"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Indonesia", "Pelatihan Perpajakan (2010)", "Akuntansi Keuangan (2015)"],
        seminarsCertificationsDetails: ["Workshop Pelaporan Keuangan (2017)", "Seminar Investasi (2020)"],
        jobHistoryDetails: ["Staf Keuangan (2007-2012)", "Analis Keuangan (2012-2018)", "Staf Keuangan Senior (2018-sekarang)"],
        performanceAchievementsDetails: ["Mengelola transaksi keuangan harian", "Membantu penyusunan laporan keuangan"],
      },
      knowledge: {
        skillSet: ["Akuntansi", "Perpajakan", "Pelaporan Keuangan", "Microsoft Office"],
        certifications: [],
      },
    },
    {
      id: '41',
      name: 'Didik Darmadi, SST, M.CIO',
      nip: 'NIP: 197506062000011006',
      position: 'Kepala Seksi Data',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=DD',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 25,
        educationTraining: 8,
        seminarsCertifications: 12,
        jobHistory: 6,
        performanceAchievements: 10,
      },
      portfolio: {
        totalExperienceDetails: ["25 tahun pengalaman di bidang data dan IT"],
        educationTrainingDetails: ["SST - Politeknik Statistika STIS", "M.CIO - Universitas Indonesia", "Pelatihan Data Science (2010)", "Cloud Computing (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Chief Information Officer (2015)", "Seminar Big Data Analytics (2020)"],
        jobHistoryDetails: ["Staf IT (2000-2005)", "Kepala Subbagian Data (2005-2012)", "Kepala Seksi Data (2012-sekarang)"],
        performanceAchievementsDetails: ["Memimpin transformasi digital BPS", "Mengembangkan strategi data yang inovatif"],
      },
      knowledge: {
        skillSet: ["Data Science", "Cloud Computing", "Manajemen Proyek IT", "Kepemimpinan IT"],
        certifications: ["Sertifikasi Chief Information Officer"],
      },
    },
    {
      id: '42',
      name: 'Sunardi',
      nip: 'NIP: 199307072018011007',
      position: 'Staf Umum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=SN',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 6,
        educationTraining: 1,
        seminarsCertifications: 2,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["6 tahun pengalaman sebagai staf umum"],
        educationTrainingDetails: ["SMA", "Pelatihan Administrasi Kantor (2019)"],
        seminarsCertificationsDetails: ["Workshop Komunikasi Efektif (2020)"],
        jobHistoryDetails: ["Staf Umum (2018-sekarang)"],
        performanceAchievementsDetails: ["Mendukung kegiatan operasional kantor", "Membantu dalam pengarsipan dokumen"],
      },
      knowledge: {
        skillSet: ["Administrasi Dasar", "Kearsipan", "Komunikasi"],
        certifications: [],
      },
    },
    {
      id: '43',
      name: 'Fitria Cahyaningtyas, A.Md.Kb.N.',
      nip: 'NIP: 199508082020012008',
      position: 'Analis Kependudukan',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=FC',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 4,
        educationTraining: 1,
        seminarsCertifications: 1,
        jobHistory: 0,
        performanceAchievements: 3,
      },
      portfolio: {
        totalExperienceDetails: ["4 tahun pengalaman di bidang kependudukan"],
        educationTrainingDetails: ["A.Md.Kb.N. - Akademi Kependudukan Nasional", "Pelatihan Survei Demografi (2021)"],
        seminarsCertificationsDetails: ["Workshop Analisis Data Kependudukan (2022)"],
        jobHistoryDetails: ["Analis Kependudukan (2020-sekarang)"],
        performanceAchievementsDetails: ["Berpartisipasi dalam pengumpulan data sensus", "Menganalisis data demografi dasar"],
      },
      knowledge: {
        skillSet: ["Analisis Kependudukan", "Pengumpulan Data", "Statistik Dasar"],
        certifications: [],
      },
    },
    {
      id: '44',
      name: 'Quarthano Reavindo, S.Si',
      nip: 'NIP: 199109092016011009',
      position: 'Statistisi',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=QR',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 9,
        educationTraining: 3,
        seminarsCertifications: 4,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["9 tahun pengalaman sebagai statistisi"],
        educationTrainingDetails: ["S1 Statistika - Universitas Padjadjaran", "Pelatihan Analisis Regresi (2019)"],
        seminarsCertificationsDetails: ["Sertifikasi R Programming (2020)", "Workshop Data Mining (2022)"],
        jobHistoryDetails: ["Staf Statistisi (2016-2019)", "Statistisi (2019-sekarang)"],
        performanceAchievementsDetails: ["Melakukan analisis statistik inferensial", "Mengembangkan model statistik prediktif"],
      },
      knowledge: {
        skillSet: ["Statistika Lanjutan", "R Programming", "Data Mining", "Pemodelan Statistik"],
        certifications: ["Sertifikasi R Programming"],
      },
    },
    {
      id: '45',
      name: 'Azzahra Ananda Putri, A.Md',
      nip: 'NIP: 199810102023012010',
      position: 'Staf Administrasi',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=AP',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 2,
        educationTraining: 0,
        seminarsCertifications: 1,
        jobHistory: 0,
        performanceAchievements: 1,
      },
      portfolio: {
        totalExperienceDetails: ["2 tahun pengalaman sebagai staf administrasi"],
        educationTrainingDetails: ["D3 Administrasi Perkantoran - Politeknik Negeri Medan", "Pelatihan Microsoft Office (2024)"],
        seminarsCertificationsDetails: ["Workshop Komunikasi Bisnis (2025)"],
        jobHistoryDetails: ["Staf Administrasi (2023-sekarang)"],
        performanceAchievementsDetails: ["Mendukung tugas administrasi dasar", "Belajar cepat dalam lingkungan kerja"],
      },
      knowledge: {
        skillSet: ["Administrasi Dasar", "Microsoft Office", "Entri Data"],
        certifications: [],
      },
    },
    {
      id: '46',
      name: 'Junawi Hartasi Saragih, SE',
      nip: 'NIP: 198011112005011011',
      position: 'Kepala Subbagian Umum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=JS',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 20,
        educationTraining: 6,
        seminarsCertifications: 10,
        jobHistory: 5,
        performanceAchievements: 8,
      },
      portfolio: {
        totalExperienceDetails: ["20 tahun pengalaman di bidang administrasi umum"],
        educationTrainingDetails: ["S1 Ekonomi - Universitas Sumatera Utara", "Pelatihan Manajemen Logistik (2010)", "Kepemimpinan Tim (2018)"],
        seminarsCertificationsDetails: ["Sertifikasi Manajer Kantor (2015)", "Seminar Tata Kelola Pemerintahan (2021)"],
        jobHistoryDetails: ["Staf Administrasi (2005-2010)", "Kepala Seksi Umum (2010-2015)", "Kepala Subbagian Umum (2015-sekarang)"],
        performanceAchievementsDetails: ["Mengelola operasional harian kantor dengan efisien", "Meningkatkan koordinasi antar bagian"],
      },
      knowledge: {
        skillSet: ["Manajemen Kantor", "Logistik", "Kepemimpinan", "Administrasi Publik"],
        certifications: ["Sertifikasi Manajer Kantor"],
      },
    },
    {
      id: '47',
      name: 'Srylinda Murni Pasaribu, S.Komp.',
      nip: 'NIP: 199212122017012012',
      position: 'Analis Jaringan',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=SP',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 7,
        educationTraining: 2,
        seminarsCertifications: 3,
        jobHistory: 1,
        performanceAchievements: 5,
      },
      portfolio: {
        totalExperienceDetails: ["7 tahun pengalaman sebagai analis jaringan"],
        educationTrainingDetails: ["S1 Ilmu Komputer - Universitas Sumatera Utara", "Pelatihan Keamanan Jaringan (2019)"],
        seminarsCertificationsDetails: ["Sertifikasi CompTIA Network+ (2020)", "Workshop Cloud Networking (2022)"],
        jobHistoryDetails: ["Staf IT (2017-2020)", "Analis Jaringan (2020-sekarang)"],
        performanceAchievementsDetails: ["Memastikan stabilitas jaringan kantor", "Mengimplementasikan protokol keamanan baru"],
      },
      knowledge: {
        skillSet: ["Jaringan Komputer", "Keamanan Jaringan", "Troubleshooting", "Linux"],
        certifications: ["Sertifikasi CompTIA Network+"],
      },
    },
    {
      id: '48',
      name: 'Jefri Monang Pangihutan Pandiangan, S.H, M.I.Kom',
      nip: 'NIP: 198501132010011013',
      position: 'Analis Hukum',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=JP',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 15,
        educationTraining: 5,
        seminarsCertifications: 8,
        jobHistory: 3,
        performanceAchievements: 7,
      },
      portfolio: {
        totalExperienceDetails: ["15 tahun pengalaman sebagai analis hukum dan komunikasi"],
        educationTrainingDetails: ["S1 Hukum - Universitas Sumatera Utara", "S2 Ilmu Komunikasi - Universitas Indonesia", "Pelatihan Hukum Pidana (2015)"],
        seminarsCertificationsDetails: ["Sertifikasi Public Speaking (2018)", "Seminar Komunikasi Politik (2021)"],
        jobHistoryDetails: ["Staf Hukum (2010-2015)", "Analis Hukum (2015-2020)", "Analis Hukum & Komunikasi (2020-sekarang)"],
        performanceAchievementsDetails: ["Memberikan analisis hukum yang cermat", "Meningkatkan komunikasi internal dan eksternal"],
      },
      knowledge: {
        skillSet: ["Hukum", "Komunikasi", "Public Speaking", "Negosiasi", "Analisis Kebijakan"],
        certifications: ["Sertifikasi Public Speaking"],
      },
    },
    {
      id: '49',
      name: 'Dahril Iskandar, A.Md',
      nip: 'NIP: 199002142015011014',
      position: 'Pengelola Data',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=DI',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 9,
        educationTraining: 3,
        seminarsCertifications: 4,
        jobHistory: 2,
        performanceAchievements: 6,
      },
      portfolio: {
        totalExperienceDetails: ["9 tahun pengalaman sebagai pengelola data"],
        educationTrainingDetails: ["D3 Teknik Komputer - Politeknik Negeri Medan", "Pelatihan Basis Data (2017)"],
        seminarsCertificationsDetails: ["Workshop SQL (2018)", "Sertifikasi Data Entry (2020)"],
        jobHistoryDetails: ["Staf Input Data (2015-2018)", "Pengelola Data (2018-sekarang)"],
        performanceAchievementsDetails: ["Memastikan keakuratan data yang diinput", "Mengelola basis data dengan efisien"],
      },
      knowledge: {
        skillSet: ["Pengelolaan Basis Data", "SQL", "Entri Data", "Microsoft Excel"],
        certifications: ["Sertifikasi Data Entry"],
      },
    },
    {
      id: '50',
      name: 'Septi Nurliani, A.P.Kb.N.',
      nip: 'NIP: 199403152019012015',
      position: 'Analis Kependudukan',
      organization: 'BPS PROVINSI SUMATERA UTARA',
      image: 'https://placehold.co/96x96/4A5568/FFFFFF?text=SN',
      satkerId: 'bps_sumut',
      stats: {
        totalExperience: 5,
        educationTraining: 2,
        seminarsCertifications: 2,
        jobHistory: 1,
        performanceAchievements: 4,
      },
      portfolio: {
        totalExperienceDetails: ["5 tahun pengalaman di bidang kependudukan"],
        educationTrainingDetails: ["A.P.Kb.N. - Akademi Kependudukan Nasional", "Pelatihan Metode Survei Kependudukan (2021)"],
        seminarsCertificationsDetails: ["Workshop Analisis Data Demografi (2022)"],
        jobHistoryDetails: ["Analis Kependudukan (2019-sekarang)"],
        performanceAchievementsDetails: ["Berpartisipasi dalam survei kependudukan", "Menganalisis data demografi untuk laporan"],
      },
      knowledge: {
        skillSet: ["Analisis Kependudukan", "Metode Survei", "Pengolahan Data"],
        certifications: [],
      },
    },
  ];

  const availableCandidates = allCandidates.filter(
    (candidate) =>
      candidate.satkerId === selectedSatker &&
      !comparisonCandidates.some((c) => c.id === candidate.id)
  );

  const handleAddCandidate = () => {
    if (selectedCandidateToAdd) {
      const candidateToAdd = allCandidates.find(
        (c) => c.id === selectedCandidateToAdd
      );
      if (candidateToAdd) {
        setComparisonCandidates([...comparisonCandidates, candidateToAdd]);
        setSelectedCandidateToAdd(''); // Reset selection
      }
    }
  };

  const handleRemoveCandidate = (id) => {
    setComparisonCandidates(comparisonCandidates.filter((c) => c.id !== id));
  };

  const handleReset = () => {
    setComparisonCandidates([]);
    setSelectedSatker('');
    setSelectedCandidateToAdd('');
  };

  const handleCompare = () => {
    if (comparisonCandidates.length > 0) {
      setShowDuelModal(true);
    } else {
      console.log('Silakan tambahkan kandidat untuk dibandingkan.');
    }
  };

  const handleAddMoreFromFloating = () => {
    // This will scroll to the top where the selection dropdown is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 pb-20"> {/* Added pb-20 for floating button space */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
          /* Custom scrollbar for floating list */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #4a5568; /* gray-700 */
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #a0aec0; /* gray-400 */
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cbd5e0; /* gray-300 */
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Perbandingan Pegawai</h1>

        {/* Bagian Pilih Satker */}
        <div className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg">
          <label htmlFor="satker-select" className="block text-gray-300 text-lg font-semibold mb-3">
            Pilih Satker
          </label>
          <div className="relative">
            <select
              id="satker-select"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={selectedSatker}
              onChange={(e) => {
                setSelectedSatker(e.target.value);
                setComparisonCandidates([]); // Reset candidates when Satker changes
                setSelectedCandidateToAdd('');
              }}
            >
              <option value="">Pilih Satker...</option>
              {satkerOptions.map((satker) => (
                <option key={satker.id} value={satker.id}>
                  {satker.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Bagian Pilih Pegawai */}
        {selectedSatker && (
          <div className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg">
            <label htmlFor="candidate-select" className="block text-gray-300 text-lg font-semibold mb-3">
              Pilih Pegawai
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <select
                  id="candidate-select"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={selectedCandidateToAdd}
                  onChange={(e) => setSelectedCandidateToAdd(e.target.value)}
                >
                  <option value="">Pilih Pegawai...</option>
                  {availableCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <button
                onClick={handleAddCandidate}
                disabled={!selectedCandidateToAdd}
                className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah
              </button>
            </div>
          </div>
        )}

        {/* Removed the old vertical comparison list here, as it's replaced by the floating button */}
        {/* Tombol Aksi - Keep these for now, as they are part of the main flow */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200"
          >
            Reset
          </button>
          {/* The main "Bandingkan" button will now be primarily accessed via the floating component */}
          {/* <button
            onClick={handleCompare}
            disabled={comparisonCandidates.length === 0}
            className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bandingkan
          </button> */}
        </div>

        {/* Modal Duel Statistik */}
        {showDuelModal && (
          <DuelStatsModal
            candidates={comparisonCandidates}
            onClose={() => setShowDuelModal(false)}
            onRemoveCandidate={handleRemoveCandidate} // Pass the remove function to the modal
          />
        )}
      </div>

      {/* Floating Comparison List */}
      {/* This floating button will only appear in the main App view, not inside the modal */}
      {comparisonCandidates.length > 0 && !showDuelModal && (
        <div className="fixed bottom-4 right-4 z-40">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-full shadow-lg p-3 cursor-pointer flex items-center justify-between"
            onClick={() => handleCompare()} // Directly trigger compare when clicked
            style={{ minWidth: '180px' }}
          >
            <span className="font-bold text-lg mr-2">VS</span>
            <span>{comparisonCandidates.length} items selected</span>
            {/* No expand/collapse arrow needed here as it directly triggers compare */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
