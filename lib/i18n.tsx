"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export type Locale = "pt-BR" | "en-US"

const translations = {
  "pt-BR": {
    // Nav
    nav_home: "Início", nav_bioscan: "BioScan", nav_workouts: "Treinos",
    nav_diet: "Dieta", nav_recipes: "Receitas", nav_store: "Loja",
    nav_aichat: "IA Chat", nav_profile: "Perfil", nav_settings: "Ajustes",
    nav_pull_down_to_close: "Deslize para fechar", nav_search_placeholder: "Buscar Módulo Bio...",
    // Views
    view_home: "Dashboard", view_bioscan: "BioScan", view_recipes: "IA Chef",
    view_training: "Planos", view_profile: "Perfil", view_planner: "Metabolismo",
    view_settings: "Ajustes", view_chatbot: "Coach IA", view_fitverse: "FitVerse",
    // Home
    home_greeting: "Olá,", home_biohacker: "Biohacker",
    home_calorie_label: "Consumo Calorias", home_kcal: "KCAL",
    home_water: "Hidratação", home_protein: "Proteína", home_longevity: "Longevidade",
    home_bio_logs: "Bio-Logs Recentes", home_last_24h: "Atividade das últimas 24h",
    home_see_history: "Ver Histórico", home_no_record: "Nenhum registro hoje",
    // Hero
    hero_social_proof: "★★★★★ 4.8 · +500 usuários",
    hero_title: "Treino e dieta personalizados por IA — prontos em segundos",
    hero_subtitle: "Responda algumas perguntas e a IA cria seu plano completo de nutrição e exercícios, adaptado ao seu corpo e rotina",
    hero_cta_primary: "Gerar meu plano grátis →",
    hero_cta_secondary: "Ver como funciona",
    cta_mid_benefits: "Quero meu plano grátis agora",
    cta_mid_how: "Quero meu plano grátis agora",
    cta_footer: "Começar agora — é grátis",
    cta_floating: "Gerar plano grátis ↑",
    // Admin
    admin_overview: "Visão Geral", admin_users: "Usuários",
    admin_revenue: "Receita", admin_ai_usage: "Uso da IA",
    admin_dataset: "Dataset IA",
    admin_settings: "Configurações",
    // Onboarding
    onboarding_welcome: "Bem-vindo ao FitVerse AI",
    onboarding_subtitle: "Sua jornada para uma vida mais saudável começa agora.",
    onboarding_body: "Para personalizar sua experiência e liberar o poder da bio-análise, precisamos primeiro definir suas metas nutricionais.",
    onboarding_cta: "Iniciar Bio-Scan",
    // Scan
    scan_title: "BioScan", scan_subtitle: "Capture a foto para análise molecular instantânea via rede neural proprietária.",
    scan_ready: "Pronto para o Scan", scan_instruction: "Aponte sua câmera para qualquer rótulo ou prato de comida.",
    scan_open_camera: "Abrir Câmera", scan_history_title: "Histórico Inteligente",
    scan_bio_mapping: "Bio-Mapeando...", scan_neural_mesh: "Lidar Neural Mesh Ativo",
    scan_score_label: "Score", scan_yesterday: "Ontem às", scan_good: "Ótimo",
    // Island
    island_ready: "Pronto", island_scanning: "Bio-Escaneando...",
    island_done: "Concluído", island_home: "Início", island_profile: "Perfil",
    // Training
    training_title: "BioMechanics", training_subtitle: "Otimização Neural de Movimento",
    filter_all: "Todos", filter_home: "Em Casa", filter_gym: "Academia",
    filter_dumbbells: "Halteres", filter_bodyweight: "Sem Equipamento",
    training_empty_title: "Neural Protocol",
    training_empty_body: "Nossa IA vai sintetizar uma rotina biomecânica baseada no seu metabolismo atual.",
    training_sync_btn: "SINCRONIZAR SESSÃO", training_start_btn: "INICIAR SESSÃO",
    training_generator_title: "Ajuste Fino Neural", training_generator_subtitle: "Protocolo v26.4",
    // Workout Generator
    wg_level: "Nível de Experiência", wg_duration: "Duração do Treino", wg_focus: "Foco Principal",
    wg_location: "Onde vai treinar?", wg_notes: "Observações Adicionais",
    wg_notes_placeholder: "Ex: Tenho dor no joelho, quero focar em glúteos...",
    wg_generate: "Gerar Treino com IA", wg_generating: "Criando seu treino...",
    wg_beginner: "Iniciante", wg_intermediate: "Intermediário", wg_advanced: "Avançado",
    wg_lose: "Emagrecer", wg_gain: "Ganhar Massa", wg_fullbody: "Full Body", wg_cardio: "Cardio",
    wg_gym: "Academia", wg_home_dumbbells: "Casa (Halteres)", wg_home_body: "Casa (Sem Equipamento)",
    // Active Workout
    aw_rest_done: "Descanso finalizado! Próxima série.",
    aw_finished_title: "Treino Concluído!", aw_finished_sub: "Você dominou o",
    aw_total_time: "Tempo Total", aw_kcal_est: "Kcal Estimadas", aw_save_log: "Salvar no Log",
    aw_no_demo: "Sem demonstração",
    aw_exercise_of: "Exercício", aw_of: "de",
    aw_set: "Série", aw_reps: "repetições", aw_done: "Feito",
    aw_rest: "Descanso", aw_skip: "Pular",
    aw_rpe: "Percepção de Esforço (RPE)", aw_easy: "Leve", aw_max: "Máximo",
    aw_next: "Próximo Exercício", aw_finish: "Finalizar Treino",
    aw_search_google: "Pesquisar no Google", aw_search_how: "Veja como fazer este exercício",
    // Recipes
    recipes_title: "BioCuisine", recipes_subtitle: "Gastronomia Molecular Inteligente",
    recipes_placeholder: "Explorar ingredientes (frango, ovos...)",
    recipes_generate_btn: "GERAR BIO-RECEITAS", recipes_saved_title: "Bio-Arquivo Pessoal",
    // Recipe Modal  
    rm_ga_synthesis: "Síntese Gastronômica IA",
    rm_time: "Tempo", rm_energy: "Energia", rm_level: "Nível", rm_servings: "Porções",
    rm_prot: "PROT", rm_carb: "CARB", rm_fat: "GORD",
    rm_easy: "Fácil", rm_medium: "Médio", rm_hard: "Difícil",
    rm_ingredients: "Recursos Requeridos", rm_instructions: "Protocolo de Execução",
    rm_biohacks: "Otimizadores de Bio-Disponibilidade",
    rm_close: "ENCERRAR SESSÃO GOURMET",
    // Chatbot
    chatbot_greeting: "Olá! Sou seu coach FitVerse. Como posso otimizar sua performance hoje?",
    chatbot_placeholder: "Pergunte ao seu Coach...", chatbot_header: "Coach FitVerse",
    chatbot_status: "FitVerse AI Ativo", chatbot_analyzing: "ANALISANDO...",
    chatbot_error: "Erro de conexão bio-neural. Tente novamente.", chatbot_net_error: "Falha na rede neural.",
    chatbot_rate_experience: "Como está sendo sua experiência com a IA?",
    chatbot_skip_rating: "Talvez depois",
    // Feedback
    feedback_thanks: "Obrigado!", feedback_helpful: "Útil", feedback_reported: "Reportado!",
    feedback_why_bad: "O que houve de errado?",
    feedback_reason_incorrect: "Incorreta", feedback_reason_generic: "Genérica",
    feedback_reason_misunderstood: "Não entendeu", feedback_reason_other: "Outro",
    feedback_send: "Enviar",
    // Profile
    profile_title: "Perfil", profile_title_accent: ".Bio", profile_subtitle: "Sincronização Vitalis",
    profile_7cycles: "7 Ciclos", profile_30cycles: "30 Ciclos",
    profile_avg_score: "Score Bio-Médio", profile_streak: "Ciclos Consecutivos",
    profile_total_scans: "Total de Bio-Scans", profile_history_title: "Neural Sync History",
    profile_history_sub: "Buffer de Memória Bio-Métrica", profile_export: "EXPORTAR",
    subscription_free_label: "Buffer de Acesso Iniciado", subscription_premium_label: "Link Neural Desbloqueado",
    subscription_upgrade: "FAZER UPGRADE", subscription_manage: "GERENCIAR LINK",
    // Settings
    settings_title: "Ajustes", settings_accent: ".Bio", settings_subtitle: "Protocolos de Experiência",
    settings_account: "Identidade Neural", settings_premium: "Acesso Premium",
    settings_premium_desc: "Remover Bio-Anúncios", settings_upgrade_badge: "UPGRADE",
    settings_prefs: "Interface & Feedback", settings_theme: "Estética Visual",
    settings_theme_desc_dark: "Esquema Dark Mode", settings_theme_desc_light: "Esquema Light Mode",
    settings_theme_btn: "ALTERAR", settings_notifications: "Bio-Alertas",
    settings_notifications_desc: "Haptics de Performance", settings_data: "Buffer Neural",
    settings_clear_cache: "Expurgar Cache", settings_clear_cache_desc: "Limpeza de buffer local",
    settings_clear_btn: "LIMPAR", settings_region: "Região & Idioma", settings_region_desc: "Global / América Latina",
    settings_language_label: "Idioma", settings_logout: "Encerrar Ciclo",
    settings_version: "FitVerse AI v4.0.26", settings_copyright: "© 2026 Apple Design Standards Compliance",
    settings_toast_cleared: "Buffer neural limpo com sucesso!", settings_toast_logout: "Conexão encerrada.",
    settings_upgrade_error: "Faça o upgrade para remover os anúncios.", settings_upgrade_action: "Upgrade",
    settings_haptics_on: "Haptics estabilizados.", settings_haptics_off: "Haptics suspensos.",
    settings_protocol_on: "ativado", settings_protocol_off: "desativado", settings_premium_locked: "Vínculo Protegido",
    // Product Result
    pr_neural_sync: "Bio-Link Estabilizado", pr_complete_synthesis: "SÍNTESE COMPLETA",
    pr_generic: "Bio-Genérico", pr_bio_risks: "Bio-Riscos", pr_optimizers: "Otimizadores",
    pr_syncing: "Sincronização Neural...",
    pr_kcal: "KCAL", pr_prot: "PROT", pr_carb: "CARB", pr_fat: "GORD",
    pr_excelente: "Excelente", pr_bom: "Bom", pr_neutro: "Neutro", pr_ruim: "Ruim",
    alt_title: "Troque por este", alt_healthier: "Mais saudável", alt_view: "Ver produto",
    alt_affiliate: "💚 Links podem conter afiliados", alt_highlights: "Destaques", alt_analyze_now: "Analise Este Produto Agora",
    // Store
    store_title: "FitStore", store_subtitle: "Algoritmo de Performance Material",
    store_search_placeholder: "Mapear suplementos ou equipamentos...",
    store_global_level: "Nível Global",
    store_synced_ia: "Sincronizado via IA", store_reviews: "avaliações bioguiadas",
    store_launch_price: "Preço de Lançamento", store_installments: "Ou {n}x de {val} sem juros",
    store_add_flow: "Adicionar ao Fluxo", store_investment: "Investimento",
    store_add: "ADICIONAR",
    store_cart_title: "Meu Carrinho", store_cart_empty: "Carrinho Vazio",
    store_subtotal: "Subtotal Global", store_checkout: "FINALIZAR SESSÃO",
    store_bio_seal: "Selo de Integridade Bio-Link",
    store_bio_seal_desc: "Todas as transações são validadas via protocolos de criptografia biométrica e conformidade Apple Security 2026.",
    store_sync: "SINCRONIZAR", store_add_cart: "Comprar",
    // Exercise Modal
    em_live_demo: "Demonstração ao Vivo",
    em_focus: "Foco:", em_safety: "Protocolos de Segurança",
    em_mistakes: "Mitigação de Erros",
    em_flow_seq: "Sequenciador de Fluxo", em_bio_session: "Sessão Ativa",
    em_sets: "Séries", em_reps: "Reps", em_rest_s: "Relax (s)",
    em_bio_recovery: "Bio-Recuperação", em_set_in_progress: "Série em Curso",
    em_complete_step: "Concluir Etapa", em_finish_seq: "Finalizar Sequência",
    em_neural_effort: "Análise de Esforço Neural",
    em_neural_effort_sub: "Como o algoritmo biológico processou esta carga?",
    em_sync_feedback: "SINCRONIZAR FEEDBACK",
    em_pre_workout: "Bio-Fuel Pré-Treino", em_top_nutrients: "Nutrientes Estelares do Histórico",
    em_neural_link: "Link Neural Iniciado...", em_no_signal: "Sinal Indisponível",
    em_search_google: "Pesquisar no Google", em_search_how: "Veja como fazer este exercício",
    em_btn_search_google: "Ver como fazer no Google",
    em_bodyweight: "Peso do Corpo", em_home_env: "Ambiente Doméstico", em_bio_gym: "Bio-Gym",
    // Metabolic Planner
    mp_title: "Metabolismo IA", mp_subtitle: "Nossa inteligência analisará seu perfil para criar a estratégia perfeita.",
    mp_body_data: "Dados Corporais", mp_weight: "Peso", mp_height: "Altura", mp_age: "Idade",
    mp_age_unit: "anos", mp_gender: "Gênero Biológico", mp_male: "MASCULINO", mp_female: "FEMININO",
    mp_activity: "Nível de Atividade", mp_goal_title: "Objetivo Principal",
    mp_sedentary: "Sedentário", mp_sedentary_desc: "Pouco ou nenhum exercício",
    mp_light: "Leve", mp_light_desc: "Exercício 1-3x/semana",
    mp_moderate: "Moderado", mp_moderate_desc: "Exercício 3-5x/semana",
    mp_active: "Ativo", mp_active_desc: "Exercício 6-7x/semana",
    mp_very_active: "Muito Ativo", mp_very_active_desc: "Exercício intenso diário",
    mp_lose: "Perder Peso", mp_maintain: "Manter Peso", mp_gain: "Ganhar Massa",
    mp_generate: "Gerar Plano Biohack", mp_generating: "Analisando Metabolismo...",
    mp_privacy: "Seus dados são processados de forma segura e utilizados apenas para gerar seu plano.",
    // Login
    login_back: "Voltar", login_title: "Entrar no BioScan", login_welcome: "Bem-vindo de volta",
    login_email: "Email", login_password: "Senha", login_button: "Entrar",
    login_loading: "Entrando...", login_no_account: "Não tem uma conta?",
    login_create_account: "Criar conta", login_or: "ou", login_demo: "🚀 Entrar como Demo (sem cadastro)",
    login_failed: "Falha no login", login_invalid: "Email ou senha incorretos",
    login_demo_user: "Usuário Demo",
    // Onboarding
    onboard_hero_title: "Seu corpo,",
    onboard_hero_subtitle: "otimizado por IA",
    onboard_hero_desc: "A plataforma de biohacking que analisa sua alimentação, cria treinos e planeja sua nutrição com inteligência artificial.",
    onboard_cta_start: "Começar agora",
    onboard_cta_how: "Ver como funciona",
    onboard_benefits_title: "Por que FitVerse AI",
    onboard_benefit1_title: "Bio-análise completa",
    onboard_benefit1_desc: "Scan inteligente de alimentos com IA",
    onboard_benefit2_title: "Treinos personalizados",
    onboard_benefit2_desc: "Planos de treino sob medida",
    onboard_benefit3_title: "Nutrição inteligente",
    onboard_benefit3_desc: "Receitas e dieta personalizada",
    onboard_how_title: "Como funciona",
    onboard_step1_title: "Faça seu Bio-Scan",
    onboard_step1_desc: "Escaneie qualquer alimento com a câmera",
    onboard_step2_title: "Receba seu plano",
    onboard_step2_desc: "IA gera recomendações personalizadas",
    onboard_step3_title: "Acompanhe o progresso",
    onboard_step3_desc: "Monitore resultados em tempo real",
    onboard_cta_title: "Pronto para transformar sua saúde?",
    onboard_cta_subtitle: "Comece agora gratuitamente",
    onboard_cta_journey: "Iniciar minha jornada",
    // Home Dashboard
    home_calories_remaining: "Calorias Restantes",
    home_start_btn: "Escanear Agora",
    home_no_records: "Nenhum registro hoje",
    home_water_goal: "{current}ml / {goal}ml",
    home_protein_goal: "{current}g / {goal}g",
  },

  "en-US": {
    // Nav
    nav_home: "Home", nav_bioscan: "BioScan", nav_workouts: "Workouts",
    nav_diet: "Diet", nav_recipes: "Recipes", nav_store: "Store",
    nav_aichat: "AI Chat", nav_profile: "Profile", nav_settings: "Settings",
    nav_pull_down_to_close: "Pull down to close", nav_search_placeholder: "Search Bio-Module...",
    // Views
    view_home: "Dashboard", view_bioscan: "BioScan", view_recipes: "AI Chef",
    view_training: "Plans", view_profile: "Profile", view_planner: "Metabolism",
    view_settings: "Settings", view_chatbot: "AI Coach", view_fitverse: "FitVerse",
    // Home
    home_greeting: "Hey,", home_biohacker: "Biohacker",
    home_calorie_label: "Calorie Intake", home_kcal: "KCAL",
    home_water: "Hydration", home_protein: "Protein", home_longevity: "Longevity",
    home_bio_logs: "Recent Bio-Logs", home_last_24h: "Last 24h activity",
    home_see_history: "See History", home_no_record: "No records today",
    // Hero
    hero_social_proof: "★★★★★ 4.8 · 500+ users",
    hero_title: "AI-Powered Workout & Diet Plans — Ready in Seconds",
    hero_subtitle: "Answer a few questions and AI builds your complete nutrition and training plan, tailored to your body and lifestyle",
    hero_cta_primary: "Generate My Free Plan →",
    hero_cta_secondary: "See How It Works",
    cta_mid_benefits: "Get My Free Plan Now",
    cta_mid_how: "Get My Free Plan Now",
    cta_footer: "Start Now — It's Free",
    cta_floating: "Get Free Plan ↑",
    // Admin
    admin_overview: "Overview", admin_users: "Users",
    admin_revenue: "Revenue", admin_ai_usage: "AI Usage",
    admin_dataset: "AI Dataset",
    admin_settings: "Settings",
    // Onboarding
    onboarding_welcome: "Welcome to FitVerse AI",
    onboarding_subtitle: "Your journey to a healthier life starts now.",
    onboarding_body: "To personalize your experience and unlock the power of bio-analysis, we first need to set your nutritional goals.",
    onboarding_cta: "Start Bio-Scan",
    // Scan
    scan_title: "BioScan", scan_subtitle: "Capture a photo for instant molecular analysis via proprietary neural network.",
    scan_ready: "Ready to Scan", scan_instruction: "Point your camera at any food label or meal.",
    scan_open_camera: "Open Camera", scan_history_title: "Smart History",
    scan_bio_mapping: "Bio-Mapping...", scan_neural_mesh: "Lidar Neural Mesh Active",
    scan_score_label: "Score", scan_yesterday: "Yesterday at", scan_good: "Great",
    // Island
    island_ready: "Ready", island_scanning: "Bio-Scanning...",
    island_done: "Done", island_home: "Home", island_profile: "Profile",
    // Training
    training_title: "BioMechanics", training_subtitle: "Neural Movement Optimization",
    filter_all: "All", filter_home: "At Home", filter_gym: "Gym",
    filter_dumbbells: "Dumbbells", filter_bodyweight: "Bodyweight",
    training_empty_title: "Neural Protocol",
    training_empty_body: "Our AI will synthesize a biomechanical routine based on your current metabolism.",
    training_sync_btn: "SYNC SESSION", training_start_btn: "START SESSION",
    training_generator_title: "Neural Fine-Tuning", training_generator_subtitle: "Protocol v26.4",
    // Workout Generator
    wg_level: "Experience Level", wg_duration: "Workout Duration", wg_focus: "Main Focus",
    wg_location: "Where will you train?", wg_notes: "Additional Notes",
    wg_notes_placeholder: "E.g.: I have knee pain, want to focus on glutes...",
    wg_generate: "Generate AI Workout", wg_generating: "Creating your workout...",
    wg_beginner: "Beginner", wg_intermediate: "Intermediate", wg_advanced: "Advanced",
    wg_lose: "Lose Weight", wg_gain: "Build Muscle", wg_fullbody: "Full Body", wg_cardio: "Cardio",
    wg_gym: "Gym", wg_home_dumbbells: "Home (Dumbbells)", wg_home_body: "Home (Bodyweight)",
    // Active Workout
    aw_rest_done: "Rest done! Next set.",
    aw_finished_title: "Workout Complete!", aw_finished_sub: "You crushed",
    aw_total_time: "Total Time", aw_kcal_est: "Est. Kcal", aw_save_log: "Save to Log",
    aw_no_demo: "No demonstration",
    aw_exercise_of: "Exercise", aw_of: "of",
    aw_set: "Set", aw_reps: "reps", aw_done: "Done",
    aw_rest: "Rest", aw_skip: "Skip",
    aw_rpe: "Rate of Perceived Exertion (RPE)", aw_easy: "Easy", aw_max: "Max",
    aw_next: "Next Exercise", aw_finish: "Finish Workout",
    aw_search_google: "Search on Google", aw_search_how: "See how to do this exercise",
    // Recipes
    recipes_title: "BioCuisine", recipes_subtitle: "Intelligent Molecular Gastronomy",
    recipes_placeholder: "Explore ingredients (chicken, eggs...)",
    recipes_generate_btn: "GENERATE BIO-RECIPES", recipes_saved_title: "Personal Bio-Archive",
    // Recipe Modal
    rm_ga_synthesis: "AI Gastronomic Synthesis",
    rm_time: "Time", rm_energy: "Energy", rm_level: "Level", rm_servings: "Servings",
    rm_prot: "PROT", rm_carb: "CARB", rm_fat: "FAT",
    rm_easy: "Easy", rm_medium: "Medium", rm_hard: "Hard",
    rm_ingredients: "Required Resources", rm_instructions: "Execution Protocol",
    rm_biohacks: "Bio-Availability Optimizers",
    rm_close: "CLOSE GOURMET SESSION",
    // Chatbot
    chatbot_greeting: "Hey! I'm your FitVerse coach. How can I optimize your performance today?",
    chatbot_placeholder: "Ask your Coach...", chatbot_header: "FitVerse Coach",
    chatbot_status: "FitVerse AI Active", chatbot_analyzing: "ANALYZING...",
    chatbot_error: "Bio-neural connection error. Please try again.", chatbot_net_error: "Neural network failure.",
    chatbot_rate_experience: "How has your AI experience been?",
    chatbot_skip_rating: "Maybe later",
    // Feedback
    feedback_thanks: "Thanks!", feedback_helpful: "Helpful", feedback_reported: "Reported!",
    feedback_why_bad: "What went wrong?",
    feedback_reason_incorrect: "Incorrect", feedback_reason_generic: "Too generic",
    feedback_reason_misunderstood: "Didn't understand", feedback_reason_other: "Other",
    feedback_send: "Send",
    // Profile
    profile_title: "Profile", profile_title_accent: ".Bio", profile_subtitle: "Vitalis Sync",
    profile_7cycles: "7 Cycles", profile_30cycles: "30 Cycles",
    profile_avg_score: "Bio-Average Score", profile_streak: "Consecutive Cycles",
    profile_total_scans: "Total Bio-Scans", profile_history_title: "Neural Sync History",
    profile_history_sub: "Bio-Metric Memory Buffer", profile_export: "EXPORT",
    subscription_free_label: "Access Buffer Initiated", subscription_premium_label: "Neural Link Unlocked",
    subscription_upgrade: "UPGRADE", subscription_manage: "MANAGE LINK",
    // Settings
    settings_title: "Settings", settings_accent: ".Bio", settings_subtitle: "Experience Protocols",
    settings_account: "Neural Identity", settings_premium: "Premium Access",
    settings_premium_desc: "Remove Bio-Ads", settings_upgrade_badge: "UPGRADE",
    settings_prefs: "Interface & Feedback", settings_theme: "Visual Aesthetic",
    settings_theme_desc_dark: "Dark Mode Scheme", settings_theme_desc_light: "Light Mode Scheme",
    settings_theme_btn: "CHANGE", settings_notifications: "Bio-Alerts",
    settings_notifications_desc: "Performance Haptics", settings_data: "Neural Buffer",
    settings_clear_cache: "Purge Cache", settings_clear_cache_desc: "Clear local buffer",
    settings_clear_btn: "CLEAR", settings_region: "Region & Language", settings_region_desc: "Global / Americas",
    settings_language_label: "Language", settings_logout: "End Session",
    settings_version: "FitVerse AI v4.0.26", settings_copyright: "© 2026 Apple Design Standards Compliance",
    settings_toast_cleared: "Neural buffer cleared successfully!", settings_toast_logout: "Connection terminated.",
    settings_upgrade_error: "Upgrade to remove bio-ads.", settings_upgrade_action: "Upgrade",
    settings_haptics_on: "Haptics stabilized.", settings_haptics_off: "Haptics suspended.",
    settings_protocol_on: "enabled", settings_protocol_off: "disabled", settings_premium_locked: "Protected Link",
    // Product Result
    pr_neural_sync: "Bio-Link Stabilized", pr_complete_synthesis: "FULL SYNTHESIS",
    pr_generic: "Bio-Generic", pr_bio_risks: "Bio-Risks", pr_optimizers: "Optimizers",
    pr_syncing: "Neural Sync...",
    pr_kcal: "KCAL", pr_prot: "PROT", pr_carb: "FAT", pr_fat: "FAT",
    pr_excelente: "Excellent", pr_bom: "Good", pr_neutro: "Neutral", pr_ruim: "Poor",
    alt_title: "Swap for this", alt_healthier: "Healthier", alt_view: "View product",
    alt_affiliate: "💚 Links may contain affiliates", alt_highlights: "Highlights", alt_analyze_now: "Analyze This Product Now",
    // Store
    store_title: "FitStore", store_subtitle: "Performance Material Algorithm",
    store_search_placeholder: "Search supplements or equipment...",
    store_global_level: "Global Level",
    store_synced_ia: "Synced via AI", store_reviews: "bio-guided reviews",
    store_launch_price: "Launch Price", store_installments: "Or {n}x of {val} interest-free",
    store_add_flow: "Add to Flow", store_investment: "Investment",
    store_add: "ADD",
    store_cart_title: "My Cart", store_cart_empty: "Empty Cart",
    store_subtotal: "Global Subtotal", store_checkout: "CHECKOUT",
    store_bio_seal: "Bio-Link Integrity Seal",
    store_bio_seal_desc: "All transactions are validated via biometric encryption protocols and Apple Security 2026 compliance.",
    store_sync: "SYNC", store_add_cart: "Buy",
    // Exercise Modal
    em_live_demo: "Live Demonstration",
    em_focus: "Focus:", em_safety: "Safety Protocols",
    em_mistakes: "Error Mitigation",
    em_flow_seq: "Flow Sequencer", em_bio_session: "Active Session",
    em_sets: "Sets", em_reps: "Reps", em_rest_s: "Rest (s)",
    em_bio_recovery: "Bio-Recovery", em_set_in_progress: "Set in Progress",
    em_complete_step: "Complete Step", em_finish_seq: "Finish Sequence",
    em_neural_effort: "Neural Effort Analysis",
    em_neural_effort_sub: "How did the biological algorithm process this load?",
    em_sync_feedback: "SYNC FEEDBACK",
    em_pre_workout: "Pre-Workout Bio-Fuel", em_top_nutrients: "Top Nutrients from History",
    em_neural_link: "Neural Link Initiated...", em_no_signal: "Signal Unavailable",
    em_bodyweight: "Bodyweight", em_home_env: "Home Environment", em_bio_gym: "Bio-Gym",
    em_btn_search_google: "See how to do on Google",
    // Metabolic Planner
    mp_title: "Metabolism AI", mp_subtitle: "Our intelligence will analyze your profile to create the perfect strategy.",
    mp_body_data: "Body Data", mp_weight: "Weight", mp_height: "Height", mp_age: "Age",
    mp_age_unit: "years", mp_gender: "Biological Gender", mp_male: "MALE", mp_female: "FEMALE",
    mp_activity: "Activity Level", mp_goal_title: "Main Goal",
    mp_sedentary: "Sedentary", mp_sedentary_desc: "Little or no exercise",
    mp_light: "Light", mp_light_desc: "Exercise 1-3x/week",
    mp_moderate: "Moderate", mp_moderate_desc: "Exercise 3-5x/week",
    mp_active: "Active", mp_active_desc: "Exercise 6-7x/week",
    mp_very_active: "Very Active", mp_very_active_desc: "Intense daily exercise",
    mp_lose: "Lose Weight", mp_maintain: "Maintain Weight", mp_gain: "Build Muscle",
    mp_generate: "Generate Biohack Plan", mp_generating: "Analyzing Metabolism...",
    mp_privacy: "Your data is processed securely and used only to generate your plan.",
    // Login
    login_back: "Back", login_title: "Sign in to BioScan", login_welcome: "Welcome back",
    login_email: "Email", login_password: "Password", login_button: "Sign In",
    login_loading: "Signing in...", login_no_account: "Don't have an account?",
    login_create_account: "Create account", login_or: "or", login_demo: "🚀 Continue as Demo (no sign-up)",
    login_failed: "Login failed", login_invalid: "Incorrect email or password",
    login_demo_user: "Demo User",
    // Onboarding
    onboard_hero_title: "Your body,",
    onboard_hero_subtitle: "AI optimized",
    onboard_hero_desc: "The biohacking platform that analyzes your food, creates workouts and plans your nutrition with artificial intelligence.",
    onboard_cta_start: "Get Started",
    onboard_cta_how: "See How It Works",
    onboard_benefits_title: "Why FitVerse AI",
    onboard_benefit1_title: "Complete Bio-analysis",
    onboard_benefit1_desc: "Smart AI food scanning",
    onboard_benefit2_title: "Personalized Workouts",
    onboard_benefit2_desc: "Tailored training plans",
    onboard_benefit3_title: "Smart Nutrition",
    onboard_benefit3_desc: "Recipes and personalized diet",
    onboard_how_title: "How It Works",
    onboard_step1_title: "Do your Bio-Scan",
    onboard_step1_desc: "Scan any food with your camera",
    onboard_step2_title: "Get your plan",
    onboard_step2_desc: "AI generates personalized recommendations",
    onboard_step3_title: "Track progress",
    onboard_step3_desc: "Monitor results in real time",
    onboard_cta_title: "Ready to transform your health?",
    onboard_cta_subtitle: "Start now for free",
    onboard_cta_journey: "Start My Journey",
    // Home Dashboard
    home_calories_remaining: "Calories Remaining",
    home_start_btn: "Scan Now",
    home_no_records: "No records today",
    home_water_goal: "{current}ml / {goal}ml",
    home_protein_goal: "{current}g / {goal}g",
  },
} as const

export type TranslationKey = keyof typeof translations["pt-BR"]

function detectLocale(): Locale {
  if (typeof window === "undefined") return "pt-BR"
  const saved = localStorage.getItem("fitverse-locale") as Locale | null
  if (saved === "pt-BR" || saved === "en-US") return saved
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const brZones = ["America/Sao_Paulo","America/Manaus","America/Fortaleza","America/Belem",
      "America/Recife","America/Cuiaba","America/Porto_Velho","America/Rio_Branco","America/Noronha"]
    if (brZones.some(z => tz.startsWith(z))) return "pt-BR"
  } catch {}
  const lang = (navigator.language || navigator.languages?.[0] || "")
  if (lang.startsWith("pt")) return "pt-BR"
  return "en-US"
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const detected = detectLocale()
    setLocaleState(detected)
    document.documentElement.lang = detected
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("fitverse-locale", newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback(
    (key: TranslationKey): string =>
      (translations[locale] as any)[key] ?? (translations["pt-BR"] as any)[key] ?? key,
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used inside I18nProvider")
  return ctx
}
