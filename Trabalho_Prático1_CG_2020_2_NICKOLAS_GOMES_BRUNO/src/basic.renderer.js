/* ------------------------------
  UFRJ 2020.2 - COMPUTAÇÃO GRÁFICA
  PROFESSOR: JOÃO VITOR OLIVEIRA
  ALUNOS: NICKOLAS GOMES PINTO e BRUNO HRYNIEWICZ
  ------------------------------ */


(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.BasicRenderer = {}));
}(this, (function (exports) { 'use strict';


    //Cria a Bounding Box e retorna os pontos extremos do retangulo 
    function cria_BoundingBox(primitive){

        var x_Inicial = 0;
        var x_Final = 0;
        var y_Inicial = 0;
        var y_Final = 0;

        var coordenadas = []; // Cria array para armazerar as coordenadas da imagem

       // Bounding Box do triangulo
        if(primitive.shape == "triangle"){

            var verticesImagem = primitive.vertices; // vertices
            var eixos = verticesImagem[0].length; // quantidade de eixos
            var pontos = verticesImagem.length; //quantidade de ponts
            var coord_x = []; // coordenadas no eixo x
            var coord_y = []; // coordenadas no eixo y

            //Seta eixo x e y com base nas coordenadas
            for(var i = 0; i < pontos; i++){

                for(var j = 0; j < eixos; j++){
                    
                    if(j == 0){

                        coord_x.push(verticesImagem[i][j]); // Recupera eixo X

                    }else{

                        coord_y.push(verticesImagem[i][j]); // Recupera eixo Y

                    } 
                }
            }

            //setando as coordenadas maximas e minimas da Bounding Box com o metodo reduce --- TO DO: TRANSFORMAR EM FUNCAO
            x_Inicial = coord_x.reduce(function (a, b) { return ( a < b ? a : b ); });
            x_Final = coord_x.reduce(function (a, b) { return ( a > b ? a : b ); });
            y_Inicial = coord_y.reduce(function (a, b) { return ( a < b ? a : b ); });
            y_Final = coord_y.reduce(function (a, b) { return ( a > b ? a : b ); });
                       
        }
        
        coordenadas = {  
            
            x_Inicial: x_Inicial,
            x_Final: x_Final,
            y_Inicial: y_Inicial,
            y_Final: y_Final, 
            
        }

        return coordenadas;
    }


    // Calcula vetor normal dado A e B
    function calculaV_Normal(A, B){

        var vetor_normal = [-1*(B[1]-A[1]), (B[0] - A[0])];
        return vetor_normal;

    }   

    // Verifica se um ponto esta dentro da imagem (primitiva)
    function inside( x, y, primitive  ) {
                                 

            if(primitive.shape == "triangle"){

                var verticesImagem = primitive.vertices; // Recupera vertices

                // Pegando as coordenadas dos pontos de cada vértice
                var P0 = [verticesImagem[0][0], verticesImagem[0][1]];
                var P1 = [verticesImagem[1][0], verticesImagem[1][1]];
                var P2 = [verticesImagem[2][0], verticesImagem[2][1]];

                // Calcula vetores normais
                var n0 = calculaV_Normal(P0, P1);
                var n1 = calculaV_Normal(P1, P2);
                var n2 = calculaV_Normal(P2, P0);

                // Vetores de cada ponto
                var d0 = [x - P0[0], y - P0[1] ];
                var d1 = [x - P1[0], y - P1[1] ];
                var d2 = [x - P2[0], y - P2[1] ];

                // Produto interno entre os vetores e normais
                var L0 = (d0[0] * n0[0]) + (d0[1] * n0[1]);
                var L1 = (d1[0] * n1[0]) + (d1[1] * n1[1]);
                var L2 = (d2[0] * n2[0]) + (d2[1] * n2[1]);

                if(L0>0 && L1>0 && L2>0){

                    return true;

                }

            }
            else{

                return false;

            }
    }
        
    
    function Screen( width, height, scene ) {

        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);   
        this.createImage();

    }


    //Função para converter Grau em Radiano
    function cenverteRadiano(a){

        var resultado = (a*Math.PI)/180;
        return resultado;

    }

    // Faz a triangulacao de poligonos e circulo (movemos o circulo para essa funcao para implementar os adicionais - antes estava na "inside")
    function triangulacao(preprop_scene, primitive ){        

        var verticesImagem = primitive.vertices; // Recupera vertices
        
        var pontos = verticesImagem.length; // Recupera pontos da imagem
        
        // Ponto inicial da triangulacao
        var P0 = [verticesImagem[0][0], verticesImagem[0][1]];

        // Gera os triangulos
        for(var k=1; k < pontos-1 ; k++){
            
            var triangulo = {

                shape:"triangle",
                vertices: [
                    [P0[0], P0[1]],
                    [verticesImagem[k][0], verticesImagem[k][1]],
                    [verticesImagem[k+1][0], verticesImagem[k+1][1]]
                ],
                color: primitive.color,

            };


            // Cria a Bounding Box dos triangulos
            var boundingBox = cria_BoundingBox(triangulo);

            preprop_scene.push( boundingBox );

            preprop_scene.push( triangulo );                            
            
        }  
        
        return preprop_scene;
    }

    Object.assign( Screen.prototype, {

            preprocess: function(scene) {
                // Possible preprocessing with scene primitives, for now we don't change anything
                // You may define bounding boxes, convert shapes, etc

                var preprop_scene = [];
                
                for( var primitive of scene ) {

                    // Se for poligono, vamos triangular
                    if(primitive.shape == "polygon" ){

                        primitive.vertices = primitive.vertices.tolist();
                        preprop_scene = triangulacao(preprop_scene, primitive); // Triangulacao do poligono
                 
                    }

                    // Se for circulo, vamos triangular
                    if(primitive.shape == "circle") {

                        var r = primitive.radius;
                        var h = primitive.center.get(0);
                        var k = primitive.center.get(1);
                        
                        var numLados = 20; // Numedo de lados, note que com um valor baixo, nossos circulos não serão tão "circulares" e com um grande número de lados conseguimos ver os pixerls falhados de muitos triangulos
                        var numVertices = numLados + 2;

                        var P0 = [h ,k];                        
                        var Vertices = []; 
                        Vertices.push(P0);

                        // Calcula angulo dos triangulos
                        var alfa = 360/numLados;
                        var beta = 0;

                        // Calcula a equação parametrica para os pontos
                        for(var i = 0; i < numVertices ; i++){


                            beta = (alfa*i); 
                            var x = Math.floor((r * Math.cos(cenverteRadiano(beta))) + h);
                            var y = Math.floor((r * Math.sin(cenverteRadiano(beta))) + k);
                            
                            var P = [x,y];
                            Vertices.push(P);                           

                        }

                        // Cria novo poligono após triangulacao
                        var polygon = {

                            shape:"polygon", 
                            vertices: Vertices,
                            color: primitive.color,

                        };

                        // Realiza a triangulacao e exibe
                        preprop_scene = triangulacao(preprop_scene, polygon);                      
                        
                    }

                    // Exibe triangulo
                    if(primitive.shape == "triangle"){

                        primitive.vertices = primitive.vertices.tolist();
                         
                        var boundingBox = cria_BoundingBox(primitive);            
                        preprop_scene.push( boundingBox );
                        
                        preprop_scene.push( primitive );
                    } 
                                        
                                  
                }

                return preprop_scene;
            },

            createImage: function() {
                this.image = nj.ones([this.height, this.width, 3]).multiply(255);
            },

            rasterize: function() {

                var color;

                // Iterra por toda a bounding box e imagem (primitiva)
                for(var k=0; k<this.scene.length; k=k+2){

                    var bbox = this.scene[k]; // Bounding Box
                   
                    var primitive = this.scene[k+1]; // Imagem
                    
                    // Ajusta tamanho
                    for (var i = bbox.x_Inicial; i <= bbox.x_Final; i++) {
                        var x = i + 0.5;
                        
                        for( var j = bbox.y_Inicial; j <= bbox.y_Final; j++) {
                            var y = j + 0.5;                            
                              
                            if ( inside( x, y, primitive ) ) {                                
                                color = primitive.color;
                                this.set_pixel( i, this.height - (j + 1), color );
                            }
                            
                        }
                    }                 
                }              
            },

            set_pixel: function( i, j, colorarr ) {

         
                this.image.set(j, i, 0, colorarr.get(0));
                this.image.set(j, i, 1, colorarr.get(1));
                this.image.set(j, i, 2, colorarr.get(2));
            },

            update: function () {

                var $image = document.getElementById('raster_image');
                $image.width = this.width; $image.height = this.height;


                nj.images.save( this.image, $image );
            }
        }
    );

    exports.Screen = Screen;
    
})));

