"use client"

import Image from "next/image"
import Link from "next/link"
import * as Tabs from "@radix-ui/react-tabs"
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Dumbbell,
  Leaf,
  Menu,
  Moon,
  Plus,
  ScanLine,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { PLAN_LIMITS } from "@/lib/plan-limits"
import { Cinema } from "./cinema"
import s from "./experience.module.css"

export type LandingMedia = {
  hero: string
  video?: string
  nutrition: string
  training: string
  recovery: string
}

const modes = [
  {
    id: "train",
    label: "Treinar",
    icon: Dumbbell,
    title: "Um plano. O seu próximo passo.",
    description: "Organize seus exercícios e acompanhe cada sessão, com espaço para evoluir no seu ritmo.",
  },
  {
    id: "eat",
    label: "Comer bem",
    icon: Leaf,
    title: "Sua alimentação, mais clara.",
    description: "Confira as estimativas de nutrientes das suas refeições e mantenha seus registros em um só lugar.",
  },
  {
    id: "recover",
    label: "Recuperar",
    icon: Moon,
    title: "Dê espaço para o descanso.",
    description: "Registre sono e humor para perceber como seus hábitos se conectam ao longo da semana.",
  },
]

const faqs = [
  [
    "Posso começar gratuitamente?",
    "Sim. O plano Free inclui 5 análises de alimentos por dia, 1 treino por mês e histórico de 7 dias. Você cria sua conta e pode conhecer os recursos antes de escolher um plano pago.",
  ],
  [
    "Preciso treinar em uma academia?",
    "Você informa os equipamentos disponíveis ao montar seu treino. Assim, pode organizar sua rotina de acordo com o lugar onde treina.",
  ],
  [
    "Como funciona a análise de alimentos?",
    "Você envia uma foto e recebe uma estimativa nutricional. Confira os alimentos e as porções antes de salvar: os valores gerados pela IA podem precisar de ajustes.",
  ],
  [
    "Consigo usar pelo celular?",
    "Sim. O VyseFit funciona no navegador do celular. A interface se adapta à tela para você consultar seus registros durante o dia.",
  ],
  [
    "O aplicativo substitui um acompanhamento profissional?",
    "Não. O VyseFit ajuda a organizar informações e hábitos. Os recursos de IA não substituem avaliação e orientação individual de profissionais de saúde.",
  ],
]

function Brand() {
  return (
    <span className={s.brand}>
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <path d="m5 8 10 21h6L31 8h-7l-6 13-6-13Z" fill="currentColor" />
        <path d="m26 4-4 8h7l4-8Z" fill="currentColor" opacity=".5" />
      </svg>
      vysefit<span className={s.brandAi}>AI</span>
    </span>
  )
}

function StartLink({ light = false }: { light?: boolean }) {
  return (
    <Link href="/auth/signup" className={`${s.button} ${light ? s.buttonLight : ""}`}>
      Começar gratuitamente
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  )
}

function Demo({ mode }: { mode: string }) {
  return (
    <div className={s.demo}>
      <div className={s.demoHeader}>
        <Brand />
        <span className={s.example}>Prévia ilustrativa</span>
      </div>
      <div className={s.demoGreeting}>
        <span>Sua rotina, em um olhar</span>
        <h3>
          {mode === "train"
            ? "Vamos dar o próximo passo?"
            : mode === "eat"
              ? "Tudo começa no prato."
              : "Respire. Você merece."}
        </h3>
      </div>
      <div className={s.week} aria-label="Exemplo de uma semana de atividades">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
          <div key={i} className={i === 3 ? s.today : ""}>
            <span>{day}</span>
            <b>{10 + i}</b>
            <i className={i < 3 ? s.dayDone : ""}>{i < 3 ? <Check size={10} /> : null}</i>
          </div>
        ))}
      </div>
      {mode === "train" ? (
        <>
          <div className={s.demoWorkout}>
            <span className={s.demoIcon}>
              <Dumbbell size={24} />
            </span>
            <div>
              <span>Seu treino de hoje</span>
              <h4>Força & movimento</h4>
              <p>
                6 exercícios <span>•</span> 40 minutos
              </p>
            </div>
            <ChevronRight size={20} />
          </div>
          <div className={s.exercise}>
            <span>Agachamento</span>
            <b>3 × 12</b>
          </div>
          <div className={s.exercise}>
            <span>Remada com halteres</span>
            <b>3 × 10</b>
          </div>
          <div className={s.demoBottom}>
            <Activity size={18} />
            <span>Um treino de cada vez.</span>
            <span className={s.demoBadge}>No seu ritmo</span>
          </div>
        </>
      ) : mode === "eat" ? (
        <>
          <div className={s.nutritionSummary}>
            <div>
              <span>Energia registrada</span>
              <strong>
                1.480 <small>kcal</small>
              </strong>
            </div>
            <span className={s.demoIcon}>
              <Leaf size={26} />
            </span>
          </div>
          <div className={s.macros}>
            {[
              ["Proteínas", "92 g", "72%"],
              ["Carboidratos", "180 g", "58%"],
              ["Gorduras", "44 g", "48%"],
            ].map(([label, value, width]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{value}</b>
                <i>
                  <em style={{ width }} />
                </i>
              </div>
            ))}
          </div>
          <div className={s.demoBottom}>
            <ScanLine size={18} />
            <span>Confira as porções antes de salvar.</span>
          </div>
        </>
      ) : (
        <>
          <div className={s.nutritionSummary}>
            <div>
              <span>Seu último descanso</span>
              <strong>
                7h <small>30min</small>
              </strong>
            </div>
            <span className={s.demoIcon}>
              <Moon size={26} />
            </span>
          </div>
          <div className={s.sleepBars} aria-label="Exemplo visual de registros de sono">
            {[45, 64, 58, 80, 52, 75, 87, 64, 76, 91, 73, 83, 65, 76, 88, 78, 60, 72, 82, 67].map((height, i) => (
              <i key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className={s.demoBottom}>
            <Leaf size={18} />
            <span>Como você está se sentindo hoje?</span>
          </div>
        </>
      )}
      <p className={s.demoDisclaimer}>Dados de exemplo. Não representam um plano pessoal.</p>
    </div>
  )
}

export function LandingExperience({ media }: { media: LandingMedia }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.revealed)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    element.querySelectorAll(`.${s.reveal}`).forEach((node) => observer.observe(node))
    element.dataset.enhanced = "true"
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    const desktop = window.matchMedia("(min-width: 801px)")
    const onResize = () => {
      if (desktop.matches) setMenuOpen(false)
    }
    document.addEventListener("keydown", close)
    desktop.addEventListener("change", onResize)
    return () => {
      document.removeEventListener("keydown", close)
      desktop.removeEventListener("change", onResize)
    }
  }, [menuOpen])

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      price: "0",
      suffix: "para começar",
      description: "O primeiro passo já conta.",
      features: [
        `${PLAN_LIMITS.free.scansPerDay} análises por dia`,
        `${PLAN_LIMITS.free.workoutsPerMonth} treino por mês`,
        `Histórico de ${PLAN_LIMITS.free.historyDays} dias`,
        "Inclui anúncios",
      ],
    },
    {
      id: "pro" as const,
      name: "Pro",
      price: "19,90",
      suffix: "por mês",
      description: "Mais espaço para sua rotina.",
      features: [
        `${PLAN_LIMITS.pro.scansPerDay} análises por dia`,
        `${PLAN_LIMITS.pro.workoutsPerMonth} treinos por mês`,
        "Planejamento de refeições",
        "Sono, humor e estresse",
        "Sem anúncios",
      ],
    },
    {
      id: "premium" as const,
      name: "Premium",
      price: "29,90",
      suffix: "por mês",
      description: "Sua experiência mais completa.",
      features: [
        "Análises e treinos ilimitados",
        "Coach com IA",
        "Meditação guiada",
        "Relatórios mensais",
        "Suporte prioritário",
      ],
    },
  ]

  return (
    <div className={s.site} ref={root}>
      <a className={s.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={s.header}>
        <Link href="/" aria-label="VyseFit AI, página inicial">
          <Brand />
        </Link>
        <nav className={s.desktopNav} aria-label="Navegação principal">
          <a href="#experiencia">A experiência</a>
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className={s.navActions}>
          <Link href="/auth/login" className={s.login}>
            Entrar
          </Link>
          <Link href="/auth/signup" className={s.navCta}>
            Começar grátis
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <button
          ref={menuButton}
          type="button"
          className={s.menuButton}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        {menuOpen && (
          <nav id="landing-menu" className={s.mobileNav} aria-label="Navegação móvel">
            <a href="#experiencia" onClick={() => setMenuOpen(false)}>
              A experiência
            </a>
            <a href="#recursos" onClick={() => setMenuOpen(false)}>
              Recursos
            </a>
            <a href="#planos" onClick={() => setMenuOpen(false)}>
              Planos
            </a>
            <Link href="/auth/login">Entrar</Link>
            <Link href="/auth/signup" className={s.navCta}>
              Começar grátis
              <ArrowUpRight size={16} />
            </Link>
          </nav>
        )}
      </header>

      <main id="conteudo" tabIndex={-1}>
        <Cinema poster={media.hero} video={media.video}>
          <div className={s.heroIntro}>
            <span className={s.heroTag}>
              <span />
              Seu corpo. Sua rotina.
            </span>
            <h1 aria-label="Seu próximo passo começa aqui.">
              <span className={s.heroOpening} aria-hidden="true">Seu próximo<br />passo começa<br />aqui.</span>
              <span className={s.heroMiddle} aria-hidden="true">Treino.<br />Alimentação.<br />Recuperação.</span>
              <span className={s.heroEnding} aria-hidden="true">Tudo no<br />seu ritmo.</span>
            </h1>
            <p>Organize seus treinos, acompanhe sua alimentação e veja sua evolução com o VyseFit AI.</p>
            <StartLink />
            <a href="#experiencia" className={s.heroExplore}>
              Conheça a experiência
              <ArrowDown size={16} />
            </a>
          </div>
        </Cinema>

        <div className={s.disciplines}>
          <span>
            <Dumbbell />
            Treino com direção
          </span>
          <i />
          <span>
            <Leaf />
            Alimentação com clareza
          </span>
          <i />
          <span>
            <Moon />
            Espaço para recuperar
          </span>
        </div>

        <section id="experiencia" className={`${s.experience} ${s.section}`}>
          <div className={`${s.sectionHeading} ${s.reveal}`}>
            <p className={s.sectionLabel}>Feito para a vida real</p>
            <h2>
              Uma rotina que faz
              <br />
              sentido para você.
            </h2>
            <p>
              Um lugar para conectar o que você faz hoje
              <br className={s.desktopBreak} /> com a evolução que quer acompanhar.
            </p>
          </div>
          <Tabs.Root defaultValue="train">
            <Tabs.List aria-label="Explore os recursos do VyseFit" className={s.tabs}>
              {modes.map((mode) => (
                <Tabs.Trigger key={mode.id} value={mode.id} className={s.tab}>
                  <mode.icon size={18} />
                  {mode.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {modes.map((mode) => (
              <Tabs.Content key={mode.id} value={mode.id} className={s.experienceGrid}>
                <div className={s.experienceCopy}>
                  <div className={s.modeCopy}>
                    <span className={s.lineMotif} aria-hidden="true" />
                    <h3>{mode.title}</h3>
                    <p>{mode.description}</p>
                    <Link href="/auth/signup" className={s.textLink}>
                      Começar gratuitamente
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                  <div className={s.smallNote}>
                    <Check size={15} />
                    Uma conta para a sua rotina inteira.
                  </div>
                </div>
                <div className={s.demoStage}>
                  <div className={s.demoContent}>
                    <Demo mode={mode.id} />
                  </div>
                  <div className={s.stageTrack} aria-hidden="true" />
                </div>
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </section>

        <section id="recursos" className={`${s.features} ${s.section}`}>
          <div className={s.featureHeading}>
            <h2>
              Pequenas escolhas.
              <br />
              Uma rotina inteira.
            </h2>
            <p>
              Da primeira refeição ao último exercício,
              <br />
              cada parte do seu dia tem seu lugar.
            </p>
          </div>
          <article className={`${s.foodFeature} ${s.reveal}`}>
            <div className={s.foodPhoto}>
              <Image
                src={media.nutrition}
                alt="Refeição colorida com vegetais e ingredientes frescos"
                fill
                sizes="(max-width: 800px) 100vw, 55vw"
              />
              <div className={s.scanCorners} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className={s.photoChip}>
                <ScanLine size={17} />
                Alimentação em foco
              </div>
            </div>
            <div className={s.foodCopy}>
              <span className={s.featureIcon}>
                <ScanLine />
              </span>
              <h3>
                Menos anotações.
                <br />
                Mais clareza.
              </h3>
              <p>Fotografe sua refeição e confira a estimativa nutricional antes de salvar.</p>
              <ul>
                <li>
                  <Check />
                  Seus alimentos em um só registro
                </li>
                <li>
                  <Check />
                  Uma visão dos nutrientes
                </li>
                <li>
                  <Check />
                  Histórico para acompanhar seus hábitos
                </li>
              </ul>
              <Link href="/auth/signup" className={s.textLink}>
                Começar gratuitamente
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
          <div className={s.featurePair}>
            <article className={`${s.photoFeature} ${s.reveal}`}>
              <Image
                src={media.training}
                alt="Atleta durante uma sessão de treino"
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
              />
              <div className={s.photoFeatureContent}>
                <span className={s.featurePill}>
                  <Dumbbell size={16} />
                  Movimento
                </span>
                <h3>
                  Seu treino
                  <br />
                  acompanha você.
                </h3>
                <p>Organize os exercícios de acordo com seu objetivo e os equipamentos disponíveis.</p>
              </div>
            </article>
            <article className={`${s.photoFeature} ${s.reveal}`}>
              <Image
                src={media.recovery}
                alt="Momento de descanso ao ar livre depois do treino"
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
              />
              <div className={s.photoFeatureContent}>
                <span className={s.featurePill}>
                  <Moon size={16} />
                  Equilíbrio
                </span>
                <h3>
                  O descanso
                  <br />
                  também conta.
                </h3>
                <p>Acompanhe sono, humor e hábitos para enxergar sua rotina por inteiro.</p>
              </div>
            </article>
          </div>
        </section>

        <section className={s.manifesto}>
          <svg viewBox="0 0 1200 280" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M-40 245C260 245 270 30 600 30s300 215 650 215M-40 268C260 268 270 53 600 53s300 215 650 215M-40 222C260 222 270 7 600 7s300 215 650 215"
              stroke="currentColor"
            />
          </svg>
          <div className={s.reveal}>
            <span>Consistência cabe na vida real.</span>
            <h2>Tudo no seu ritmo.</h2>
            <p>Um passo possível hoje. Outro amanhã.</p>
          </div>
        </section>

        <section id="planos" className={`${s.pricing} ${s.section}`}>
          <div className={`${s.sectionHeading} ${s.reveal}`}>
            <p className={s.sectionLabel}>Espaço para evoluir</p>
            <h2>Comece no seu ritmo.</h2>
            <p>
              Conheça o app gratuitamente.
              <br />
              Escolha mais recursos quando fizer sentido.
            </p>
          </div>
          <div className={s.planGrid}>
            {plans.map((plan) => (
              <article key={plan.id} className={`${s.plan} ${plan.id === "pro" ? s.planFeatured : ""}`}>
                <div className={s.planName}>
                  <h3>{plan.name}</h3>
                  {plan.id === "pro" && <span>Para o dia a dia</span>}
                </div>
                <p>{plan.description}</p>
                <div className={s.price}>
                  <span>R$</span>
                  <strong>{plan.price}</strong>
                </div>
                <span className={s.pricePeriod}>{plan.suffix}</span>
                <Link
                  href={plan.id === "free" ? "/auth/signup" : "/subscription"}
                  className={`${s.button} ${plan.id === "pro" ? s.buttonLight : s.buttonOutline}`}
                >
                  {plan.id === "free" ? "Começar gratuitamente" : `Conhecer o ${plan.name}`}
                  <ArrowUpRight size={17} />
                </Link>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className={s.pricingNote}>
            Valores mensais apresentados no aplicativo. Confira as condições na assinatura.
          </p>
        </section>

        <section className={`${s.faq} ${s.section}`}>
          <div>
            <p className={s.sectionLabel}>Dúvidas, sem complicar</p>
            <h2>
              Antes do
              <br />
              primeiro passo.
            </h2>
          </div>
          <div className={s.faqList}>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={s.finalCta}>
          <div className={s.reveal}>
            <span className={s.finalIcon}>
              <Activity size={28} />
            </span>
            <h2>
              Seu próximo passo
              <br />
              pode ser hoje.
            </h2>
            <StartLink light />
            <p>Treino. Alimentação. Recuperação.</p>
          </div>
          <div className={s.finalWord} aria-hidden="true">
            vysefit
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <Link href="/" aria-label="VyseFit AI, início">
          <Brand />
        </Link>
        <span>Feito para acompanhar você.</span>
        <nav aria-label="Links do rodapé">
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
          <Link href="/auth/login">Entrar</Link>
        </nav>
        <div className={s.footerBottom}>
          <span>© {new Date().getFullYear()} VyseFit AI</span>
          <span>Imagens ilustrativas geradas por IA.</span>
        </div>
      </footer>
    </div>
  )
}
