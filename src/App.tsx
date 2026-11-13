import SourcesContext from './components/SourcesContext';
import blueskyIcon from './assets/social/dear-representative-social-icons/bluesky.svg?raw';
import twitterIcon from './assets/social/dear-representative-social-icons/twitter.svg?raw';
import MessageComposer from './components/MessageComposer';
import {useState} from 'react';
import SocialComposer from './components/SocialComposer';
import DelegationDirectory from './components/DelegationDirectory';
import PetitionDirectory from './components/PetitionDirectory';
import {campaigns} from './campaigns';
import {legislators} from './data/states';
import {stateFor} from './data/states/current';

export default function App() {
  const campaign = campaigns[0];
  const [officialId, setOfficialId] = useState('B001278'); // Suzanne Bonamici (bioguide)
  const official = legislators.find(o => o.id === officialId) ?? legislators[0];
  const state = stateFor(official.state);
  const delegation = legislators.filter(o => o.state === official.state);

  return (
    <div className="site">
      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">U.S. CONGRESS · CIVIC CONTACT</div>
          <h1>Make your voice heard.</h1>
          <p>Find official congressional contact channels for current members, write your own message, and explore public petitions. Your message stays in your browser. Nothing is submitted automatically.</p>
          <nav className="section-nav" aria-label="Page sections">
            <a href="#contact">01 / Email, Form &amp; Phone</a>
            <a href="#social">02 / Social</a>
            <a href="#petitions">03 / Petitions</a>
            <a href="#directory">04 / Directory</a>
            {campaign.research && <a href="#sources">05 / Sources &amp; Context</a>}
          </nav>
        </div>
      </header>
      <main className="wrap">
        <MessageComposer
          campaign={campaign}
          officials={legislators}
          delegation={delegation}
          state={state}
          officialId={official.id}
          onOfficialChange={setOfficialId}
        />
        <section id="social" className="panel" aria-labelledby="social-title">
          <div className="eyebrow">02 / SOCIAL</div>
          <h2 id="social-title" className="social-heading-content">Social
            {/* Trusted local artwork only; preserve currentColor and original paths. */}
            <span className="social-heading-icons" aria-hidden="true">
              <span dangerouslySetInnerHTML={{__html: blueskyIcon}}/>
              <span dangerouslySetInnerHTML={{__html: twitterIcon}}/>
            </span>
          </h2>
          <SocialComposer campaign={campaign} official={official} state={state}/>
        </section>
        <PetitionDirectory petitions={campaign.petitions}/>
        <DelegationDirectory officials={delegation} state={state}/>
        {campaign.research && <SourcesContext research={campaign.research}/>}
      </main>
      <footer className="wrap">
        <section className="privacy-disclosure" aria-labelledby="privacy-title">
          <h2 id="privacy-title">Your privacy</h2>
          <p>Messages are composed locally in your browser. The application does not intentionally collect, transmit, or save the names, locations, or message contents you enter; they remain in browser memory while you use the composer. Copying places text on your device clipboard.</p>
          <p>External congressional and petition websites have their own privacy practices. GitHub Pages, which hosts this site, may process ordinary technical request information and access logs. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub’s privacy statement</a>.</p>
        </section>
        <p>Independent civic information tool · No affiliation with Congress or petition platforms · No automatic submissions</p>
      </footer>
    </div>
  );
}
