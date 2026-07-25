import React from 'react';

// Diamond Logo (Original Dark Text Logo for White Frame)
import diamondLogo from '../assets/Sponser/Daimond/cropped_logo.png';

// Gold Logos (Original Brand Assets)
import goldDM from '../assets/Sponser/Gold/dm_black.png';
import goldPocari from '../assets/Sponser/Gold/clean_pocari.png';
import goldWinchill from '../assets/Sponser/Gold/clean_winchill.png';

// Silver Logos (Original Brand Assets)
import silverSingha from '../assets/Sponser/Silver/clean_singha.png';
import silverKohkae from '../assets/Sponser/Silver/clean_kohkae.png';
import silverPM from '../assets/Sponser/Silver/PM_Logo_01.jpg';
import silverSR from '../assets/Sponser/Silver/clean_sr.png';
import silverImg224 from '../assets/Sponser/Silver/clean_224_perfect.png';

const SponsorsSection = ({ lang = 'TH' }) => {
  const isTH = lang === 'TH';

  const sponsors = [
    { name: 'Pocari Sweat', src: goldPocari },
    { name: 'Winchill', src: goldWinchill },
    { name: 'DM', src: goldDM },
    { name: 'Singha', src: silverSingha },
    { name: 'Koh-Kae', src: silverKohkae },
    { name: 'PM', src: silverPM },
    { name: 'SR', src: silverSR },
    { name: '224 Photo', src: silverImg224 }
  ];

  return (
    <div className="w-full max-w-lg mx-auto my-6 px-0">
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-sm sm:text-base font-bold text-magical-gold tracking-wide uppercase">
          {isTH ? 'ผู้สนับสนุนอย่างเป็นทางการ' : 'Official Event Sponsors'}
        </h3>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-1.5 opacity-75" />
      </div>

      {/* Single Symmetrical White Frame Container (Matching Top Frame: max-w-lg) */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center border border-gray-100">
        {/* Diamond Logo Display */}
        <div className="w-full flex justify-center pb-5 mb-5 border-b border-gray-100">
          <img
            src={diamondLogo}
            alt="KMUTT Alumni Association"
            className="h-10 sm:h-14 md:h-16 w-auto max-w-[260px] sm:max-w-[320px] object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* All Original Sponsor Logos Rendered Directly (Without Individual Frames) */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 w-full">
          {sponsors.map((sponsor, index) => (
            <img
              key={index}
              src={sponsor.src}
              alt={sponsor.name}
              className="h-8 sm:h-10 md:h-12 w-auto max-w-[100px] sm:max-w-[130px] object-contain transition-transform duration-300 hover:scale-110"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SponsorsSection;
