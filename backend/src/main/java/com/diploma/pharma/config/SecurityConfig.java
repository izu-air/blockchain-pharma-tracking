package com.diploma.pharma.config;

import com.diploma.pharma.security.JwtAuthenticationFilter;
import com.diploma.pharma.service.JwtService;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            @Value("${app.security.require-authentication-for-mutations:true}") boolean requireAuthForMutations
    ) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        http.authorizeHttpRequests(auth -> {
            if (!requireAuthForMutations) {
                auth.anyRequest().permitAll();
                return;
            }
            auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/swagger-ui/index.html")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()
                    .anyRequest().permitAll();
        });

        http.exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"JWT required for this operation\"}");
        }));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${FRONTEND_ORIGIN:http://localhost:5173}") String frontendOrigin
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendOrigin.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
