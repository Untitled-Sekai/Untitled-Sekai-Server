import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <h1>Untitled Sekaiについて</h1>

      <section className="about-section">
        <h2>このサービスについて</h2>
        <p>
          UntitledSekaiは、「プロジェクトセカイカラフルステージ! feet.初音ミク」の創作譜面用の譜面投稿プラットフォームです。
        </p>
      </section>
      <section className="about-section">
        <h2>開発者情報</h2>
        <p>
          Untitled Sekaiは、「ぴぃまん」が運営しています。
          <br />
          <a href="https://github.com/Piliman22" target="_blank" rel="noopener noreferrer" className="contact-link">@Piliman22</a> <br /> <br />
          他に以下の方々に協力していただきました。<br /> <br />
          <ul>
            <li>
              <a href="https://x.com/uni1027838" target="_blank" rel="noopener noreferrer" className="contact-link">@uni01</a>
              <p>Wiki制作</p>
            </li>
            <li>
              <a href="http://discordapp.com/users/1178983271858708522" target="_blank" rel="noopener noreferrer" className="contact-link">@waidesu_</a>
              <p>Discordサーバーでのアイコンのデザイン</p>
            </li>
            <li>
              <a href="http://discordapp.com/users/980287779391041626" target="_blank" rel="noopener noreferrer" className="contact-link">@medetaich</a>
              <p>Sonolusで反映されるバナーのデザイン</p>
            </li>
          </ul>
        </p>
        <section className="about-section">
          <h2>モデレーター一覧</h2>
          <p>
            Untitled Sekaiのモデレーターは以下の方々です。<br /> <br />
            <ul>
              <li>
                <a href="http://discordapp.com/users/1178983271858708522" target="_blank" rel="noopener noreferrer" className="contact-link">@waidesu_</a>
              </li>
              <li>
                <a href="http://discordapp.com/users/997721175365013514" target="_blank" rel="noopener noreferrer" className="contact-link">@coniro26</a>
              </li>
              <li>
                <a href="http://discordapp.com/users/872480997734768720" target="_blank" rel="noopener noreferrer" className="contact-link">@rururoro9121</a>
              </li>
            </ul>
          </p>
        </section>

        <section className="about-section">
          <h2>Discord</h2>
          <p>
            Untitled Sekaiのサポートは、以下のDiscordサーバーで行っています。<br /> <br />
            <a href="https://discord.gg/P7dAWHRRRn" target="_blank" rel="noopener noreferrer" className="contact-link">Untitled_Sekai_Server</a>
          </p>
        </section>
        <section className='about-section'>
          <h2>GitHub</h2>
          <p>
            Untitled Sekaiはオープンソースです。<br /> <br />
            <a href='' target="_blank" rel="noopener noreferrer" className="contact-link">github</a>
          </p>
        </section>
        <section className='about-section'>
          <h2>支援</h2>
          <p>
            もしあなたがこのプロジェクトに感銘を受けたなら、ぜひ支援してくれると助かります。<br /> <br />
            この支援金は、サーバーの維持費、開発、ドメインの維持費のみに使用されます。<br /> <br />
            <ul>
              <li><a href="https://ko-fi.com/pim4n" target="_blank" rel="noopener noreferrer" className="contact-link">BuyMeACoffee</a></li>
              <li><a href='https://kyash.me/payments/lbIReeMUeWyYYOw0g8aJqSaafikR' target="_blank" rel="noopener noreferrer" className="contact-link">Kyash</a></li>
            </ul>
          </p>
        </section>
      </section>
    </div>
  );
};

export default About;