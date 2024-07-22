---
title: "Usando Hugo"
date: 2024-07-21T11:22:44-04:00
draft: false
toc: false
---

# ¿Cómo levantar un sitio simple usando Hugo?
El proceso en general es simple, aunque debo admitir que me vi complicado en varios momentos, más que nada por *apurete* y no leer con su debido cuidado la documentación. Iré pasito a pasito por si a alguien más le sirve!

## Creando la App

1. __Instalar Go__: Hugo es una aplicación basada en Go, por lo que todo lo que viene se hace mucho más comodo instalandolo (https://go.dev/doc/install).
    > __*¿y qué es go?*__ Go es un lenguaje de programación, así como lo son Python, Java, Rust, entre otros. Fue creado por Google el 2007, y se destaca por su simplicidad, eficiencia y seguridad.
    Su mascota es un castor llamado [Gopher](https://go.dev/blog/gopher)
2. __Instalar HUGO__: Lo siguiente es instalar Hugo, en general recomiendo instalar la versión *extendida*, dado que viene con más herramientas incluídas y muchos temas de sitios web se basan en esta versión. Ahora bien, si buscas algo más simple, puedes instalar la versión estándar (https://gohugo.io/installation/).

3. __Crear Aplicación Base__: esto nos crea el proyecto de Hugo, basta con ejecutar:
    ```
    hugo new site NOMBRE_APP
    ```
    Deberás reemplazar `NOMBRE_APP` por el nombre de tu aplicación. Esto nos crea una carpeta `NOMBRE_APP` con la estructura básica del proyecto.
4. __Crear u obtener un tema__: en mi caso yo instalé un tema desde (https://themes.gohugo.io), pero puedes crear el tuyo desde 0 ([aquí hay una buena guía](https://draft.dev/learn/creating-hugo-themes)). Cada tema ofrece sus propias instrucciones de instalación, así que no entraré en mucho detalle allí.
5. __Probar localmente__: puedes levantar el sitio usando el comando `hugo server`.

## Levantar en Github pages
6. __Subir a github__: primero debes subir el proyecto a un repositorio de Github. Recomiendo crear en la raíz del proyecto un `.gitignore`, y añadir dentro:
    ```
    # .gitignore
    public/
    resources/
    ```
    Con ello, sólo se cargaran los archivos estrictamente necesarios, y no los compilados.
7. __Establecer Workflow__: para el despliegue de la aplicación utilizaremos *Github Actions*. Para ello hay que indicarle a Github el flujo de despliegue para el repositorio.
    - Crear archivo con instrucciones: `.github/workflows/deploy.yml`
    - Rellenar con instrucciones para despliegue de aplicaciones hugo. Las dejo a continuación:
        ```yml
        name: github pages

        on:
        push:
            branches:
            - main # Set a branch to deploy

        jobs:
        deploy:
            runs-on: ubuntu-22.04
            steps:
            - uses: actions/checkout@v2
                with:
                submodules: true  # Fetch Hugo themes (true OR recursive)
                fetch-depth: 0    # Fetch all history for .GitInfo and .Lastmod

            - name: Setup Hugo
                uses: peaceiris/actions-hugo@v3
                with:
                hugo-version: '0.119.0'
                extended: true

            # Opcional: establece un caché
            - name: Caching
                uses: actions/cache@v2
                with:
                path: /tmp/hugo_cache
                key: ${{ runner.os }}-hugomod-${{ hashFiles('**/go.sum') }}
                restore-keys: |
                    ${{ runner.os }}-hugomod-${{ hashFiles('**/go.sum') }}

            - name: Build Hugo
                run: hugo --gc --minify

            - name: Deploy to GitHub Pages
                uses: peaceiris/actions-gh-pages@v3
                with:
                github_token: ${{ secrets.GITHUB_TOKEN }}
                publish_dir: ./public
        ```
        Recuerda hacer push!
    - En Github, ir a las Configuraciones del repositorio, e ir al apartado general de *Actions*, presente en la barra lateral. Aquí, en la última sección, tenemos que dar permisos de *Lectura y Escritura* al flujo de trabajo. En resumen:
        - `Settings > Actions > General`
        - `Workflow permissions`
        - `Read and write permissions`

        Esto permite que el workflow pueda escribir los archivos compilados en una nueva rama.
    - Finalmente, queda habilitar el despliegue mediante Github pages. Para ello hay que ir a `Settings > Pages`, y:
        - En *Build and deployment* hay que establecer la fuente o *source* a *Deploy from a branch*.
        - Luego, establecemos que la branch sea `gh-pages`.

(Nota en construcción)
