# StarCalc

Uma calculadora independente para estimar quanto custa **retomar uma assinatura pausada da Starlink** no meio do ciclo de faturamento e quantos dados ficam disponíveis até a próxima fatura. Também simula a cobrança adicional em uma troca imediata de plano.

O projeto nasceu de uma necessidade prática: eu queria viajar no fim do mês, reativar a Starlink só pelo período em que precisaria dela e saber **quanto pagaria até a próxima fatura**. Como muitas vezes pauso ou cancelo o serviço depois da viagem por não usá-lo com frequência, precisava de uma forma simples de fazer essa conta antes de decidir quando ativar. A primeira versão da calculadora foi feita em HTML; o projeto atual usa Vue 3, Vite e Tailwind CSS.

## Como usar

1. Escolha o plano e confira a mensalidade exibida na sua conta Starlink.
2. A data da ativação começa em hoje. Informe a data da **próxima renovação / fatura** mostrada na sua conta Starlink. Ela começa vazia porque varia de pessoa para pessoa.
3. Veja o valor, a franquia e o tempo restante atualizados automaticamente.

O botão **Ajustes avançados** permite alterar a franquia, a regra de dados, o horário em UTC e o início do ciclo. Os campos preenchidos, inclusive a data da próxima fatura, são salvos no `localStorage` deste navegador e reaparecem na próxima visita. Não há conta nem envio dos dados a um servidor. Use **Limpar** para restaurar os valores iniciais.

O cálculo divide o tempo entre a ativação e a renovação pela duração total do ciclo. Para uma troca de plano, aplica essa fração à diferença positiva entre as mensalidades. A estimativa pode diferir da cobrança real por regras de faturamento, impostos, créditos, promoções e horário usado pela Starlink.

## Desenvolvimento

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Verificação:

```bash
npm test
npm run build
```

## Planos e preços

Os planos estão em [`src/data/plans.json`](src/data/plans.json). Os preços são referências migradas do HTML original em **09/10/2026** e não são atualizados automaticamente. Planos sem preço conhecido usam `null` e solicitam que a pessoa informe a mensalidade. Antes de alterar valores, confira os planos na [Starlink Brasil](https://starlink.com/br/service-plans) e, principalmente, o preço mostrado na conta do usuário.

Para adicionar um plano, inclua um objeto em `plans` com `id`, `name`, `category`, `monthlyPrice`, `quotaGB`, `dataPolicy` e `priceStatus`. Use `quotaGB: 0` e `dataPolicy: "unlimited"` para planos sem franquia limitada.

## Publicação na Vercel

Importe este repositório na Vercel. Use `npm run build` como comando de build e `dist` como diretório de saída. Não é necessário backend.

O build gera HTML com o conteúdo da página já renderizado, `robots.txt`, metadados para busca e compartilhamento e dados estruturados `WebApplication`. Para gerar também URL canônica, imagem social com URL absoluta e `sitemap.xml`, configure `SITE_URL` com o endereço público definitivo, por exemplo `https://starcalc.seudominio.com`. Na Vercel, o build também aceita `VERCEL_PROJECT_PRODUCTION_URL` quando disponível. Use sempre o domínio de produção, não a URL temporária de preview.

Depois da publicação, cadastre o domínio no [Google Search Console](https://search.google.com/search-console/about), envie `https://seu-dominio/sitemap.xml` e use a inspeção de URL para conferir o HTML renderizado. A indexação e a posição nos resultados dependem do Google e não são garantidas pelas metatags.

## Contribuições

Encontrou um preço desatualizado, uma regra de cálculo diferente ou tem uma sugestão de interface? [Abra uma issue](https://github.com/WenderGalan/StarCalc/issues/new) descrevendo o plano, o cenário e, se possível, uma fonte oficial. Pull requests também são bem-vindos.

Criado por [Wender Galan](https://github.com/WenderGalan). © 2026 Wender Galan. Licenciado sob [MIT](LICENSE).

StarCalc é um projeto independente e não é afiliado à Starlink. Starlink é marca de seus respectivos titulares.
