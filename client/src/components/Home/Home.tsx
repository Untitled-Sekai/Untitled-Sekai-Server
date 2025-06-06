import React from 'react'
import './Home.css'

const Home: React.FC = () => {
    return (
        <div className="home">
            <section className="welcome">
                <h1>UntitledSekaiへようこそ</h1>
                <p className="tagline">
                    <a href="https://untitled-sekai-wiki.pim4n-net.com/" target="_blank" rel="noopener noreferrer">はじめての方はこちらからWikiを読んでください。</a>
                </p>

                <div className="cta-buttons">
                    <a href="/charts" className="cta-button primary">譜面一覧</a>
                    <a href="/upload" className="cta-button secondary">譜面をアップロード</a>
                </div>
            </section>
        </div>
    )
}

export default Home